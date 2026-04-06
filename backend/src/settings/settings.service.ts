import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt } from '../common/utils/crypto.util';

/** 암호화 저장이 필요한 키 목록 */
const ENCRYPTED_KEYS = ['smtpPassword'];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 모든 설정을 { key: value } 형태로 반환 (내부용 - 암호화된 값 그대로)
   */
  async findAll(): Promise<Record<string, any>> {
    const rows = await this.prisma.setting.findMany();
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  /**
   * 클라이언트 노출용 — 민감 정보 마스킹
   */
  async findAllForClient(): Promise<Record<string, any>> {
    const result = await this.findAll();
    for (const key of ENCRYPTED_KEYS) {
      if (result[key]) {
        result[key] = '***'; // 마스킹
      }
    }
    return result;
  }

  /**
   * 특정 키의 설정값 조회 (없으면 defaultValue 반환)
   */
  async get(key: string, defaultValue: any = null): Promise<any> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? row.value : defaultValue;
  }

  /**
   * 여러 설정을 일괄 업데이트 (upsert)
   */
  async updateMany(settings: Record<string, any>): Promise<Record<string, any>> {
    const entries = Object.entries(settings);

    await this.prisma.$transaction(
      entries.map(([key, value]) => {
        // 민감 키는 암호화 (빈 문자열은 변경 없는 것으로 간주하여 스킵)
        let storedValue = value;
        if (ENCRYPTED_KEYS.includes(key)) {
          if (value === '' || value === null) {
            // 빈 값은 기존 값 유지하기 위해 noop upsert
            return this.prisma.setting.upsert({
              where: { key },
              update: {},
              create: { key, value: '' },
            });
          }
          storedValue = encrypt(String(value));
        }
        return this.prisma.setting.upsert({
          where: { key },
          update: { value: storedValue },
          create: { key, value: storedValue },
        });
      }),
    );

    return this.findAll();
  }

  /**
   * 초기 기본 설정값 시딩 (이미 존재하면 건너뜀)
   */
  async seedDefaults(): Promise<void> {
    const defaults: Record<string, any> = {
      siteName: 'ContentCMS',
      siteDescription: '',
      siteUrl: 'http://localhost:5173',
      adminEmail: 'admin@cms.com',
      logoUrl: '',
      faviconUrl: '',
      timezone: 'Asia/Seoul',
      dateFormat: 'YYYY-MM-DD',
      postsPerPage: 10,
      maintenanceMode: false,
    };

    for (const [key, value] of Object.entries(defaults)) {
      const exists = await this.prisma.setting.findUnique({ where: { key } });
      if (!exists) {
        await this.prisma.setting.create({ data: { key, value } });
      }
    }
  }
}

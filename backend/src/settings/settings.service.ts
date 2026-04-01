import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 모든 설정을 { key: value } 형태로 반환
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
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
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

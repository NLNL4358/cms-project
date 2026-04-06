import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * 새 API 키 생성
   * 반환된 평문 키는 한 번만 표시되고 다시 볼 수 없음
   */
  async create(params: {
    name: string;
    permissions?: string[];
    expiresAt?: string | null;
  }) {
    // sk_live_ + 32바이트 랜덤 문자열
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('base64url')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 16); // sk_live_xxxxxxxx

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: params.name,
        keyHash,
        keyPrefix,
        permissions: params.permissions || ['public:read'],
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      },
    });

    // 평문 키를 한 번만 반환
    return {
      ...apiKey,
      key: rawKey,
      message: '이 키는 다시 표시되지 않습니다. 안전한 곳에 저장하세요.',
    };
  }

  /**
   * 모든 API 키 목록 (평문 키 제외)
   */
  async findAll() {
    return this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * API 키 검증 (Public API에서 사용)
   * 평문 키를 받아 검증하고 매칭되는 ApiKey 레코드 반환
   */
  async verify(rawKey: string): Promise<any> {
    if (!rawKey || !rawKey.startsWith('sk_live_')) {
      return null;
    }

    const keyPrefix = rawKey.substring(0, 16);

    // prefix로 먼저 후보 조회
    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, isActive: true },
    });

    for (const candidate of candidates) {
      // 만료 체크
      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        continue;
      }

      // bcrypt 검증
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (match) {
        // lastUsedAt 업데이트 (비동기)
        this.prisma.apiKey
          .update({
            where: { id: candidate.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
        return candidate;
      }
    }

    return null;
  }

  /**
   * API 키 삭제 (revoke)
   */
  async remove(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API 키를 찾을 수 없습니다');
    await this.prisma.apiKey.delete({ where: { id } });
    return { success: true };
  }

  /**
   * API 키 활성/비활성 토글
   */
  async toggle(id: string, isActive: boolean) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API 키를 찾을 수 없습니다');
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });
  }
}

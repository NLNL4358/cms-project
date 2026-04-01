import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 감사 로그 기록
   */
  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }

  /**
   * 감사 로그 목록 조회 (필터 + 페이지네이션)
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) {
        where.occurredAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.occurredAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
      }
    }

    if (query.search) {
      where.OR = [
        { entity: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // userId → 이메일/이름 매핑
    const userIds = [...new Set(rows.filter((r) => r.userId).map((r) => r.userId))] as string[];
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, name: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = rows.map((row) => {
      const user = row.userId ? userMap.get(row.userId) : null;
      return {
        ...row,
        userEmail: user?.email || null,
        userName: user?.name || null,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 감사 로그 상세 조회
   */
  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  /**
   * 고유 액션 목록 (필터 드롭다운용)
   */
  async getActions(): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return result.map((r) => r.action);
  }

  /**
   * 고유 엔티티 목록 (필터 드롭다운용)
   */
  async getEntities(): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
      orderBy: { entity: 'asc' },
    });
    return result.map((r) => r.entity);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      contentTypeCount,
      contentCounts,
      mediaCount,
      mediaTotalSize,
      userCount,
      recentContents,
    ] = await Promise.all([
      // 콘텐츠 타입 수
      this.prisma.contentType.count(),

      // 상태별 콘텐츠 수
      this.prisma.content.groupBy({
        by: ['status'],
        _count: true,
        where: { deletedAt: null },
      }),

      // 미디어 파일 수
      this.prisma.media.count({ where: { deletedAt: null } }),

      // 미디어 총 용량
      this.prisma.media.aggregate({
        _sum: { size: true },
        where: { deletedAt: null },
      }),

      // 사용자 수
      this.prisma.user.count(),

      // 최근 콘텐츠 (10개)
      this.prisma.content.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updatedAt: true,
          contentType: { select: { name: true, slug: true } },
          updatedBy: { select: { name: true } },
        },
      }),
    ]);

    // 상태별 카운트를 객체로 변환
    const statusCounts: Record<string, number> = {};
    let totalContent = 0;
    for (const item of contentCounts) {
      statusCounts[item.status] = item._count;
      totalContent += item._count;
    }

    // 누락된 상태는 0으로
    for (const status of Object.values(ContentStatus)) {
      if (!(status in statusCounts)) {
        statusCounts[status] = 0;
      }
    }

    return {
      contentTypes: contentTypeCount,
      contents: {
        total: totalContent,
        byStatus: statusCounts,
      },
      media: {
        count: mediaCount,
        totalSize: mediaTotalSize._sum.size || 0,
      },
      users: userCount,
      recentContents,
    };
  }
}

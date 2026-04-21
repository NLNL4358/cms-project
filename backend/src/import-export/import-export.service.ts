import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class ImportExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * 콘텐츠 내보내기 (JSON)
   */
  async exportJson(contentFormId: string, filters?: { status?: string }) {
    const contentForm = await this.getContentForm(contentFormId);
    const where = this.buildExportWhere(contentFormId, filters);

    const contents = await this.prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        slug: true,
        data: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      contentForm: {
        name: contentForm.name,
        slug: contentForm.slug,
        fields: contentForm.fields,
      },
      exportedAt: new Date().toISOString(),
      count: contents.length,
      data: contents,
    };
  }

  /**
   * 콘텐츠 내보내기 (CSV)
   */
  async exportCsv(contentFormId: string, filters?: { status?: string }) {
    const contentForm = await this.getContentForm(contentFormId);
    const where = this.buildExportWhere(contentFormId, filters);

    const contents = await this.prisma.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        slug: true,
        data: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // 동적 필드 키 수집 (data: 접두사로 시스템 필드와 구분)
    const fields = Array.isArray(contentForm.fields) ? contentForm.fields : [];
    const dynamicKeys = fields.map((f: any) => f.name);

    // CSV 헤더 — 동적 필드는 "data:필드명" 형식
    const headers = [
      'title', 'slug', 'status', 'publishedAt', 'createdAt',
      ...dynamicKeys.map((k) => `data:${k}`),
    ];
    const csvRows = [headers.join(',')];

    for (const content of contents) {
      const data = (content.data || {}) as Record<string, any>;
      const row = [
        this.csvEscape(content.title),
        this.csvEscape(content.slug),
        content.status,
        content.publishedAt?.toISOString() || '',
        content.createdAt.toISOString(),
        ...dynamicKeys.map((key) => this.csvEscape(String(data[key] ?? ''))),
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * 콘텐츠 가져오기 미리보기 (유효성 검사)
   */
  async importPreview(
    contentFormId: string,
    items: Array<{ title: string; slug: string; data?: any }>,
  ) {
    const contentForm = await this.getContentForm(contentFormId);

    // 기존 slug 조회 (중복 체크용)
    const existingSlugs = await this.prisma.content.findMany({
      where: { contentFormId, deletedAt: null },
      select: { slug: true },
    });
    const slugSet = new Set(existingSlugs.map((c) => c.slug));

    // 대상 폼의 필드 정의 파싱
    const targetFields = Array.isArray(contentForm.fields)
      ? (contentForm.fields as any[])
      : [];
    const allowedKeys = new Set(targetFields.map((f) => f.name));
    const requiredKeys = targetFields
      .filter((f) => f.required)
      .map((f) => f.name);

    const results = items.map((item, index) => {
      const errors: string[] = [];

      if (!item.title?.trim()) {
        errors.push('제목이 비어있습니다');
      }
      if (!item.slug?.trim()) {
        errors.push('고유주소가 비어있습니다');
      } else if (slugSet.has(item.slug)) {
        errors.push(`고유주소 "${item.slug}"가 이미 존재합니다`);
      }

      // data 필드 스키마 검증 — 대상 폼의 필드 정의와 호환성
      const data = (item.data && typeof item.data === 'object') ? item.data : {};
      const dataKeys = Object.keys(data);

      // 1) 대상 폼에 정의되지 않은 키가 포함되어 있는지
      const unknownKeys = dataKeys.filter((k) => !allowedKeys.has(k));
      if (unknownKeys.length > 0) {
        errors.push(
          `대상 콘텐츠 폼에 정의되지 않은 필드가 포함되어 있습니다: ${unknownKeys.join(', ')}`,
        );
      }

      // 2) 필수 필드 누락
      const missingRequired = requiredKeys.filter((k) => {
        const v = data[k];
        return v === undefined || v === null || v === '';
      });
      if (missingRequired.length > 0) {
        errors.push(`필수 필드가 비어있습니다: ${missingRequired.join(', ')}`);
      }

      return {
        row: index + 1,
        title: item.title || '',
        slug: item.slug || '',
        valid: errors.length === 0,
        errors,
      };
    });

    return {
      total: items.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      items: results,
    };
  }

  /**
   * 콘텐츠 가져오기 실행
   */
  async importExecute(
    contentFormId: string,
    userId: string,
    items: Array<{ title: string; slug: string; data?: any; status?: string }>,
    overwrite = false,
  ) {
    const contentForm = await this.getContentForm(contentFormId);

    // 대상 폼의 필드 정의 (스키마 검증용)
    const targetFields = Array.isArray(contentForm.fields)
      ? (contentForm.fields as any[])
      : [];
    const allowedKeys = new Set(targetFields.map((f) => f.name));
    const requiredKeys = targetFields
      .filter((f) => f.required)
      .map((f) => f.name);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.title?.trim() || !item.slug?.trim()) {
          skipped++;
          continue;
        }

        // 스키마 검증 — 잘못된 폼으로 import하는 것 차단
        const data = (item.data && typeof item.data === 'object') ? item.data : {};
        const unknownKeys = Object.keys(data).filter((k) => !allowedKeys.has(k));
        if (unknownKeys.length > 0) {
          skipped++;
          errors.push({
            row: i + 1,
            error: `대상 콘텐츠 폼에 정의되지 않은 필드: ${unknownKeys.join(', ')}`,
          });
          continue;
        }
        const missingRequired = requiredKeys.filter((k) => {
          const v = data[k];
          return v === undefined || v === null || v === '';
        });
        if (missingRequired.length > 0) {
          skipped++;
          errors.push({
            row: i + 1,
            error: `필수 필드 누락: ${missingRequired.join(', ')}`,
          });
          continue;
        }

        // slug 중복 체크 (활성 레코드)
        const existing = await this.prisma.content.findFirst({
          where: { contentFormId, slug: item.slug, deletedAt: null },
        });

        if (existing) {
          if (overwrite) {
            const validStatus = this.resolveStatus(item.status);
            await this.prisma.content.update({
              where: { id: existing.id },
              data: {
                title: item.title,
                data: item.data || existing.data,
                status: validStatus || existing.status,
                updatedById: userId,
              },
            });
            updated++;
          } else {
            skipped++;
            errors.push({ row: i + 1, error: `고유주소 "${item.slug}"가 이미 존재합니다` });
          }
          continue;
        }

        // soft-deleted 레코드가 있으면 복원 (unique 제약 우회)
        const softDeleted = await this.prisma.content.findFirst({
          where: { contentFormId, slug: item.slug, deletedAt: { not: null } },
        });

        if (softDeleted) {
          await this.prisma.content.update({
            where: { id: softDeleted.id },
            data: {
              title: item.title,
              data: item.data || {},
              status: this.resolveStatus(item.status) || ContentStatus.DRAFT,
              deletedAt: null,
              updatedById: userId,
            },
          });
        } else {
          await this.prisma.content.create({
            data: {
              contentFormId,
              title: item.title,
              slug: item.slug,
              data: item.data || {},
              status: this.resolveStatus(item.status) || ContentStatus.DRAFT,
              createdById: userId,
              updatedById: userId,
            },
          });
        }
        created++;
      } catch (e) {
        skipped++;
        errors.push({ row: i + 1, error: e.message });
      }
    }

    return { created, updated, skipped, errors };
  }

  /**
   * CSV 파싱 (간단한 파서)
   */
  parseCsv(csvText: string): Array<Record<string, string>> {
    // Windows(\r\n) / Mac(\r) 줄바꿈 통일
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV 파일에 데이터가 없습니다');
    }

    const headers = this.parseCsvLine(lines[0]);
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }

    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private csvEscape(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /** status 문자열을 ContentStatus enum으로 안전 변환 (잘못된 값은 null) */
  private resolveStatus(status?: string): ContentStatus | null {
    if (!status) return null;
    const valid = Object.values(ContentStatus);
    return valid.includes(status as ContentStatus) ? (status as ContentStatus) : null;
  }

  private async getContentForm(contentFormId: string) {
    const ct = await this.prisma.contentForm.findUnique({
      where: { id: contentFormId },
    });
    if (!ct) throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    return ct;
  }

  private buildExportWhere(contentFormId: string, filters?: { status?: string }) {
    const where: any = { contentFormId, deletedAt: null };
    if (filters?.status) {
      where.status = filters.status;
    }
    return where;
  }
}

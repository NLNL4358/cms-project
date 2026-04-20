import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentFormDto } from './dto/create-content-form.dto';
import { UpdateContentFormDto } from './dto/update-content-form.dto';

@Injectable()
export class ContentFormService {
  constructor(private prisma: PrismaService) {}

  async create(createContentFormDto: CreateContentFormDto) {
    // 빈 문자열 categoryId는 null로 정규화 ("카테고리 없음" 표현 통일)
    const data = { ...createContentFormDto };
    if (data.categoryId === '') data.categoryId = null;

    // slug 중복 확인
    const existing = await this.prisma.contentForm.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 고유주소입니다');
    }

    // categoryId 유효성 확인
    if (data.categoryId) {
      const category = await this.prisma.formCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException('선택한 카테고리를 찾을 수 없습니다');
      }
    }

    return this.prisma.contentForm.create({
      data,
      include: {
        category: {
          select: { id: true, name: true, order: true },
        },
      },
    });
  }

  async findAll(categoryId?: string) {
    const where =
      categoryId === undefined
        ? undefined
        : categoryId === 'null' || categoryId === ''
          ? { categoryId: null }
          : { categoryId };

    return this.prisma.contentForm.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, order: true },
        },
      },
    });
  }

  async findOne(idOrSlug: string) {
    // CUID 형식 확인 (c로 시작하고 25자 정도)
    const isCuid = /^c[a-z0-9]{24,25}$/i.test(idOrSlug);

    const contentForm = isCuid
      ? await this.prisma.contentForm.findUnique({
          where: { id: idOrSlug },
          include: {
            category: {
              select: { id: true, name: true, order: true },
            },
          },
        })
      : await this.prisma.contentForm.findUnique({
          where: { slug: idOrSlug },
          include: {
            category: {
              select: { id: true, name: true, order: true },
            },
          },
        });

    if (!contentForm) {
      throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    }

    return contentForm;
  }

  async findBySlug(slug: string) {
    const contentForm = await this.prisma.contentForm.findUnique({
      where: { slug },
    });

    if (!contentForm) {
      throw new NotFoundException('콘텐츠 폼을 찾을 수 없습니다');
    }

    return contentForm;
  }

  async update(idOrSlug: string, updateContentFormDto: UpdateContentFormDto) {
    // 존재 여부 확인 및 실제 ID 가져오기
    const contentForm = await this.findOne(idOrSlug);

    // 빈 문자열 categoryId는 null로 정규화 ("카테고리 없음" 선택 시 FK 에러 방지)
    const data = { ...updateContentFormDto };
    if (data.categoryId === '') data.categoryId = null;

    // slug 변경 시 중복 확인
    if (data.slug) {
      const existing = await this.prisma.contentForm.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: contentForm.id },
        },
      });

      if (existing) {
        throw new ConflictException('이미 사용 중인 고유주소입니다');
      }
    }

    // categoryId 유효성 확인 (null로 지우는 경우는 허용)
    if (data.categoryId) {
      const category = await this.prisma.formCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException('선택한 카테고리를 찾을 수 없습니다');
      }
    }

    return this.prisma.contentForm.update({
      where: { id: contentForm.id },
      data,
      include: {
        category: {
          select: { id: true, name: true, order: true },
        },
      },
    });
  }

  async remove(idOrSlug: string) {
    // 존재 여부 확인 및 실제 ID 가져오기
    const contentForm = await this.findOne(idOrSlug);

    // 이 콘텐츠 폼을 사용하는 콘텐츠가 있는지 확인
    const contentsCount = await this.prisma.content.count({
      where: { contentFormId: contentForm.id },
    });

    if (contentsCount > 0) {
      throw new ConflictException(
        `이 콘텐츠 폼을 사용하는 콘텐츠가 ${contentsCount}개 있습니다. 먼저 콘텐츠를 삭제해주세요.`,
      );
    }

    await this.prisma.contentForm.delete({
      where: { id: contentForm.id },
    });

    return { message: '콘텐츠 폼이 삭제되었습니다' };
  }
}

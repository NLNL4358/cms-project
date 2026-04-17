import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';

@Injectable()
export class ContentTypeService {
  constructor(private prisma: PrismaService) {}

  async create(createContentTypeDto: CreateContentTypeDto) {
    // 빈 문자열 categoryId는 null로 정규화 ("카테고리 없음" 표현 통일)
    const data = { ...createContentTypeDto };
    if (data.categoryId === '') data.categoryId = null;

    // slug 중복 확인
    const existing = await this.prisma.contentType.findUnique({
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

    return this.prisma.contentType.create({
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

    return this.prisma.contentType.findMany({
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

    const contentType = isCuid
      ? await this.prisma.contentType.findUnique({
          where: { id: idOrSlug },
          include: {
            category: {
              select: { id: true, name: true, order: true },
            },
          },
        })
      : await this.prisma.contentType.findUnique({
          where: { slug: idOrSlug },
          include: {
            category: {
              select: { id: true, name: true, order: true },
            },
          },
        });

    if (!contentType) {
      throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    }

    return contentType;
  }

  async findBySlug(slug: string) {
    const contentType = await this.prisma.contentType.findUnique({
      where: { slug },
    });

    if (!contentType) {
      throw new NotFoundException('콘텐츠 타입을 찾을 수 없습니다');
    }

    return contentType;
  }

  async update(idOrSlug: string, updateContentTypeDto: UpdateContentTypeDto) {
    // 존재 여부 확인 및 실제 ID 가져오기
    const contentType = await this.findOne(idOrSlug);

    // 빈 문자열 categoryId는 null로 정규화 ("카테고리 없음" 선택 시 FK 에러 방지)
    const data = { ...updateContentTypeDto };
    if (data.categoryId === '') data.categoryId = null;

    // slug 변경 시 중복 확인
    if (data.slug) {
      const existing = await this.prisma.contentType.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: contentType.id },
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

    return this.prisma.contentType.update({
      where: { id: contentType.id },
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
    const contentType = await this.findOne(idOrSlug);

    // 이 콘텐츠 타입을 사용하는 콘텐츠가 있는지 확인
    const contentsCount = await this.prisma.content.count({
      where: { contentTypeId: contentType.id },
    });

    if (contentsCount > 0) {
      throw new ConflictException(
        `이 콘텐츠 타입을 사용하는 콘텐츠가 ${contentsCount}개 있습니다. 먼저 콘텐츠를 삭제해주세요.`,
      );
    }

    await this.prisma.contentType.delete({
      where: { id: contentType.id },
    });

    return { message: '콘텐츠 타입이 삭제되었습니다' };
  }
}

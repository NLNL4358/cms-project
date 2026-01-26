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
    const { slug } = createContentTypeDto;

    // slug 중복 확인
    const existing = await this.prisma.contentType.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 slug입니다');
    }

    return this.prisma.contentType.create({
      data: createContentTypeDto,
    });
  }

  async findAll() {
    return this.prisma.contentType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(idOrSlug: string) {
    // CUID 형식 확인 (c로 시작하고 25자 정도)
    const isCuid = /^c[a-z0-9]{24,25}$/i.test(idOrSlug);

    const contentType = isCuid
      ? await this.prisma.contentType.findUnique({
          where: { id: idOrSlug },
        })
      : await this.prisma.contentType.findUnique({
          where: { slug: idOrSlug },
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

    // slug 변경 시 중복 확인
    if (updateContentTypeDto.slug) {
      const existing = await this.prisma.contentType.findFirst({
        where: {
          slug: updateContentTypeDto.slug,
          NOT: { id: contentType.id },
        },
      });

      if (existing) {
        throw new ConflictException('이미 사용 중인 slug입니다');
      }
    }

    return this.prisma.contentType.update({
      where: { id: contentType.id },
      data: updateContentTypeDto,
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

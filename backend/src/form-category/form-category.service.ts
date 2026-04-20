import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormCategoryDto } from './dto/create-form-category.dto';
import { UpdateFormCategoryDto } from './dto/update-form-category.dto';

@Injectable()
export class FormCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.formCategory.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { contentForms: true } },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.formCategory.findUnique({
      where: { id },
      include: {
        contentForms: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }
    return category;
  }

  async create(dto: CreateFormCategoryDto) {
    // name 중복 확인
    const existing = await this.prisma.formCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이름입니다');
    }

    return this.prisma.formCategory.create({ data: dto });
  }

  async update(id: string, dto: UpdateFormCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const dup = await this.prisma.formCategory.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (dup) throw new ConflictException('이미 사용 중인 이름입니다');
    }

    return this.prisma.formCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // onDelete: SetNull에 의해 소속 ContentForm.categoryId가 자동 NULL 처리됨
    await this.prisma.formCategory.delete({ where: { id } });
    return { message: '카테고리가 삭제되었습니다' };
  }
}

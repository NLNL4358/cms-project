import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
  constructor(private prisma: PrismaService) {}

  /**
   * 새로운 폴더 생성
   */
  async create(createFolderDto: CreateFolderDto) {
    const { parentId } = createFolderDto;

    // 상위 폴더가 지정된 경우 존재 확인
    if (parentId) {
      const parent = await this.prisma.mediaFolder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('상위 폴더를 찾을 수 없습니다');
      }
    }

    return this.prisma.mediaFolder.create({
      data: createFolderDto,
      include: {
        parent: true, // 상위 폴더 정보
        _count: {
          select: {
            children: true, // 하위 폴더 개수
            media: true, // 포함된 미디어 개수
          },
        },
      },
    });
  }

  /**
   * 모든 폴더 조회 (계층 구조 포함)
   */
  async findAll() {
    return this.prisma.mediaFolder.findMany({
      include: {
        parent: true,
        children: true, // 직접적인 하위 폴더들
        _count: {
          select: {
            children: true,
            media: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 특정 폴더 조회
   */
  async findOne(id: string) {
    const folder = await this.prisma.mediaFolder.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
            media: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('폴더를 찾을 수 없습니다');
    }

    return folder;
  }

  /**
   * 폴더 수정
   */
  async update(id: string, updateFolderDto: UpdateFolderDto) {
    // 폴더 존재 확인
    await this.findOne(id);

    // 순환 참조 방지
    if (updateFolderDto.parentId) {
      // 자기 자신을 상위 폴더로 설정하는 것 방지
      if (updateFolderDto.parentId === id) {
        throw new BadRequestException(
          '폴더는 자기 자신을 상위 폴더로 가질 수 없습니다',
        );
      }

      // 순환 참조가 발생하는지 확인
      const isCircular = await this.checkCircularReference(
        id,
        updateFolderDto.parentId,
      );
      if (isCircular) {
        throw new BadRequestException('순환 참조가 발생합니다');
      }
    }

    return this.prisma.mediaFolder.update({
      where: { id },
      data: updateFolderDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
            media: true,
          },
        },
      },
    });
  }

  /**
   * 폴더 삭제
   */
  async remove(id: string) {
    const folder = await this.findOne(id);

    // 하위 폴더가 있는지 확인
    if (folder._count.children > 0) {
      throw new ConflictException(
        `이 폴더에 ${folder._count.children}개의 하위 폴더가 있습니다. 먼저 하위 폴더를 삭제해주세요.`,
      );
    }

    // 포함된 미디어 파일이 있는지 확인
    if (folder._count.media > 0) {
      throw new ConflictException(
        `이 폴더에 ${folder._count.media}개의 미디어 파일이 있습니다. 먼저 파일을 이동하거나 삭제해주세요.`,
      );
    }

    await this.prisma.mediaFolder.delete({
      where: { id },
    });

    return { message: '폴더가 삭제되었습니다' };
  }

  /**
   * 순환 참조 확인 헬퍼 메서드
   * 폴더 A를 폴더 B의 하위로 이동할 때,
   * 폴더 B가 폴더 A의 하위에 있으면 순환 참조 발생
   */
  private async checkCircularReference(
    folderId: string,
    newParentId: string,
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    // 상위 폴더를 계속 타고 올라가면서 확인
    while (currentId) {
      if (currentId === folderId) {
        return true; // 순환 참조 발견
      }

      const folder: { parentId: string | null } | null =
        await this.prisma.mediaFolder.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      currentId = folder?.parentId || null;
    }

    return false; // 순환 참조 없음
  }
}

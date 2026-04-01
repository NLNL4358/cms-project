import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, type, roleIds } = createUserDto;

    // 이메일 중복 확인
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        type: type || 'ADMIN',
      },
      select: this.userSelect(),
    });

    // 역할 할당
    if (roleIds?.length) {
      await this.assignRoles(user.id, roleIds);
    }

    return this.findOne(user.id);
  }

  async findAll(params?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, search, page = 1, limit = 20 } = params || {};

    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          ...this.userSelect(),
          roles: {
            where: { status: 'ACTIVE' },
            select: {
              role: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => ({
        ...u,
        roles: u.roles.map((ur) => ur.role),
      })),
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.userSelect(),
        roles: {
          where: { status: 'ACTIVE' },
          select: {
            role: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return {
      ...user,
      roles: user.roles.map((ur) => ur.role),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const { password, roleIds, ...rest } = updateUserDto;

    // 이메일 중복 확인
    if (rest.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: rest.email, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
    }

    const data: any = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    await this.prisma.user.update({
      where: { id },
      data,
    });

    // 역할 재할당
    if (roleIds !== undefined) {
      // 기존 역할 모두 제거
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      // 새 역할 할당
      if (roleIds.length) {
        await this.assignRoles(id, roleIds);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('자기 자신은 삭제할 수 없습니다');
    }

    await this.findOne(id);

    // 관련 데이터 정리 (refresh tokens, user roles)
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });

    return { message: '사용자가 삭제되었습니다' };
  }

  private async assignRoles(userId: string, roleIds: string[]) {
    for (const roleId of roleIds) {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!role) continue;

      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        create: {
          userId,
          roleId,
          status: 'ACTIVE',
          requestedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: userId,
        },
        update: {
          status: 'ACTIVE',
          approvedAt: new Date(),
        },
      });
    }
  }

  private userSelect() {
    return {
      id: true,
      email: true,
      name: true,
      type: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}

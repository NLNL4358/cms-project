import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, slug, description, permissions } = createRoleDto;

    // Slug 중복 확인
    const existingRole = await this.prisma.role.findUnique({
      where: { slug },
    });

    if (existingRole) {
      throw new ConflictException('이미 사용 중인 slug입니다');
    }

    // Name 중복 확인
    const existingNameRole = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingNameRole) {
      throw new ConflictException('이미 사용 중인 역할 이름입니다');
    }

    // 권한 형식 검증 (resource:action 형식)
    this.validatePermissions(permissions);

    // 역할 생성
    const role = await this.prisma.role.create({
      data: {
        name,
        slug,
        description,
        permissions,
      },
    });

    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(idOrSlug: string) {
    // CUID 형식 확인
    const isCuid = /^c[a-z0-9]{24,25}$/i.test(idOrSlug);

    const role = isCuid
      ? await this.prisma.role.findUnique({
          where: { id: idOrSlug },
          include: {
            _count: {
              select: {
                users: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        })
      : await this.prisma.role.findUnique({
          where: { slug: idOrSlug },
          include: {
            _count: {
              select: {
                users: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        });

    if (!role) {
      throw new NotFoundException('역할을 찾을 수 없습니다');
    }

    return role;
  }

  async update(idOrSlug: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(idOrSlug);

    // Slug 중복 확인 (변경하는 경우)
    if (updateRoleDto.slug && updateRoleDto.slug !== role.slug) {
      const existingRole = await this.prisma.role.findUnique({
        where: { slug: updateRoleDto.slug },
      });

      if (existingRole) {
        throw new ConflictException('이미 사용 중인 slug입니다');
      }
    }

    // Name 중복 확인 (변경하는 경우)
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingNameRole = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (existingNameRole) {
        throw new ConflictException('이미 사용 중인 역할 이름입니다');
      }
    }

    // 권한 형식 검증 (변경하는 경우)
    if (updateRoleDto.permissions) {
      this.validatePermissions(updateRoleDto.permissions);
    }

    // 역할 수정
    return this.prisma.role.update({
      where: { id: role.id },
      data: updateRoleDto,
    });
  }

  async remove(idOrSlug: string) {
    const role = await this.findOne(idOrSlug);

    // 해당 역할을 가진 활성화된 유저가 있는지 확인
    const activeUserCount = await this.prisma.userRole.count({
      where: {
        roleId: role.id,
        status: 'ACTIVE',
      },
    });

    if (activeUserCount > 0) {
      throw new ConflictException(
        `${activeUserCount}명의 사용자가 이 역할을 사용 중입니다. 먼저 역할을 제거해주세요.`,
      );
    }

    // 역할 삭제
    await this.prisma.role.delete({
      where: { id: role.id },
    });

    return { message: '역할이 삭제되었습니다' };
  }

  /**
   * 권한 형식 검증
   * - resource:action 형식 또는 * (전체 권한)
   * - resource:* (특정 리소스의 모든 액션)
   */
  private validatePermissions(permissions: string[]) {
    const validPattern = /^([a-z-]+:\*|[a-z-]+:[a-z-]+|\*)$/;

    for (const permission of permissions) {
      if (!validPattern.test(permission)) {
        throw new BadRequestException(
          `잘못된 권한 형식입니다: ${permission}. "resource:action", "resource:*", 또는 "*" 형식이어야 합니다.`,
        );
      }
    }
  }

  /**
   * 특정 유저가 특정 권한을 가지고 있는지 확인
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    // 유저의 활성화된 역할들 조회
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        role: true,
      },
    });

    // 권한 확인
    for (const userRole of userRoles) {
      const rolePermissions = userRole.role.permissions as string[];

      // * (전체 권한)이 있으면 true
      if (rolePermissions.includes('*')) {
        return true;
      }

      // 정확히 일치하는 권한이 있으면 true
      if (rolePermissions.includes(permission)) {
        return true;
      }

      // resource:* 형식 권한 확인
      const [resource] = permission.split(':');
      if (rolePermissions.includes(`${resource}:*`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 특정 유저가 여러 권한 중 하나라도 가지고 있는지 확인
   */
  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 특정 유저가 모든 권한을 가지고 있는지 확인
   */
  async hasAllPermissions(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }
}

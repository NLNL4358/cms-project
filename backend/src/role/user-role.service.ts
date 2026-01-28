import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestRoleDto } from './dto/request-role.dto';

@Injectable()
export class UserRoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 사용자가 역할 요청
   */
  async requestRole(userId: string, requestRoleDto: RequestRoleDto) {
    const { roleId } = requestRoleDto;

    // 역할 존재 확인
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('역할을 찾을 수 없습니다');
    }

    // 이미 활성화된 역할인지 확인
    const existingActiveRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        status: 'ACTIVE',
      },
    });

    if (existingActiveRole) {
      throw new ConflictException('이미 해당 역할을 보유하고 있습니다');
    }

    // 이미 대기 중인 요청이 있는지 확인
    const existingPendingRequest = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        status: 'PENDING',
      },
    });

    if (existingPendingRequest) {
      throw new ConflictException('이미 해당 역할에 대한 요청이 대기 중입니다');
    }

    // 역할 요청 생성
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        status: 'PENDING',
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return userRole;
  }

  /**
   * 모든 대기 중인 역할 요청 조회
   */
  async getPendingRequests() {
    return this.prisma.userRole.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * 특정 사용자의 역할 요청 조회
   */
  async getUserRequests(userId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
      },
      include: {
        role: true,
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  /**
   * 역할 요청 승인
   */
  async approveRequest(requestId: string, approverId: string) {
    // 요청 존재 확인
    const request = await this.prisma.userRole.findUnique({
      where: { id: requestId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('역할 요청을 찾을 수 없습니다');
    }

    // 대기 중인 요청인지 확인
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `이 요청은 이미 처리되었습니다 (현재 상태: ${request.status})`,
      );
    }

    // 역할 요청 승인
    const approvedRequest = await this.prisma.userRole.update({
      where: { id: requestId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: approverId,
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return approvedRequest;
  }

  /**
   * 역할 요청 거절
   */
  async rejectRequest(
    requestId: string,
    rejecterId: string,
    reason?: string,
  ) {
    // 요청 존재 확인
    const request = await this.prisma.userRole.findUnique({
      where: { id: requestId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('역할 요청을 찾을 수 없습니다');
    }

    // 대기 중인 요청인지 확인
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `이 요청은 이미 처리되었습니다 (현재 상태: ${request.status})`,
      );
    }

    // 역할 요청 거절
    const rejectedRequest = await this.prisma.userRole.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: rejecterId,
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return rejectedRequest;
  }

  /**
   * 사용자의 활성화된 역할 조회
   */
  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        role: true,
      },
      orderBy: {
        approvedAt: 'desc',
      },
    });
  }

  /**
   * 사용자의 역할 제거 (관리자만)
   */
  async removeUserRole(userId: string, roleId: string, adminId: string) {
    // 역할 존재 확인
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        status: 'ACTIVE',
      },
    });

    if (!userRole) {
      throw new NotFoundException('해당 사용자에게 이 역할이 없습니다');
    }

    // 역할 제거 (삭제)
    await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    return { message: '역할이 제거되었습니다' };
  }
}

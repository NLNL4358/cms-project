import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRoleService } from './user-role.service';
import { RequestRoleDto } from './dto/request-role.dto';
import { ApproveRoleRequestDto } from './dto/approve-role-request.dto';
import { RejectRoleRequestDto } from './dto/reject-role-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@ApiTags('User Roles')
@Controller('user-roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '역할 요청',
    description: '사용자가 특정 역할을 요청합니다',
  })
  @ApiResponse({ status: 201, description: '역할 요청 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '역할을 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '이미 보유한 역할이거나 대기 중인 요청이 있음',
  })
  requestRole(
    @CurrentUser('id') userId: string,
    @Body() requestRoleDto: RequestRoleDto,
  ) {
    return this.userRoleService.requestRole(userId, requestRoleDto);
  }

  @Get('requests/pending')
  @UseGuards(PermissionsGuard)
  @Permissions('role:assign', '*')
  @ApiOperation({
    summary: '대기 중인 역할 요청 목록',
    description: '모든 대기 중인 역할 요청을 조회합니다 (관리자 권한 필요)',
  })
  @ApiResponse({ status: 200, description: '대기 중인 요청 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getPendingRequests() {
    return this.userRoleService.getPendingRequests();
  }

  @Get('my-requests')
  @ApiOperation({
    summary: '내 역할 요청 목록',
    description: '현재 사용자의 모든 역할 요청을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '내 요청 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getMyRequests(@CurrentUser('id') userId: string) {
    return this.userRoleService.getUserRequests(userId);
  }

  @Get('my-roles')
  @ApiOperation({
    summary: '내 역할 목록',
    description: '현재 사용자의 활성화된 역할을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '내 역할 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getMyRoles(@CurrentUser('id') userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Post('requests/:id/approve')
  @UseGuards(PermissionsGuard)
  @Permissions('role:assign', '*')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '역할 요청 승인',
    description: '대기 중인 역할 요청을 승인합니다 (관리자 권한 필요)',
  })
  @ApiResponse({ status: 200, description: '역할 요청 승인 성공' })
  @ApiResponse({ status: 400, description: '이미 처리된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  approveRequest(
    @Param('id') requestId: string,
    @CurrentUser('id') approverId: string,
    @Body() _approveDto: ApproveRoleRequestDto,
  ) {
    return this.userRoleService.approveRequest(requestId, approverId);
  }

  @Post('requests/:id/reject')
  @UseGuards(PermissionsGuard)
  @Permissions('role:assign', '*')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '역할 요청 거절',
    description: '대기 중인 역할 요청을 거절합니다 (관리자 권한 필요)',
  })
  @ApiResponse({ status: 200, description: '역할 요청 거절 성공' })
  @ApiResponse({ status: 400, description: '이미 처리된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '요청을 찾을 수 없음' })
  rejectRequest(
    @Param('id') requestId: string,
    @CurrentUser('id') rejecterId: string,
    @Body() rejectDto: RejectRoleRequestDto,
  ) {
    return this.userRoleService.rejectRequest(
      requestId,
      rejecterId,
      rejectDto.reason,
    );
  }

  @Get('users/:userId/roles')
  @UseGuards(PermissionsGuard)
  @Permissions('user:read', '*')
  @ApiOperation({
    summary: '특정 사용자의 역할 조회',
    description: '특정 사용자의 활성화된 역할을 조회합니다 (관리자 권한 필요)',
  })
  @ApiResponse({ status: 200, description: '사용자 역할 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getUserRoles(@Param('userId') userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Delete('users/:userId/roles/:roleId')
  @UseGuards(PermissionsGuard)
  @Permissions('role:assign', '*')
  @ApiOperation({
    summary: '사용자의 역할 제거',
    description: '특정 사용자의 역할을 제거합니다 (관리자 권한 필요)',
  })
  @ApiResponse({ status: 200, description: '역할 제거 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '역할을 찾을 수 없음' })
  removeUserRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.userRoleService.removeUserRole(userId, roleId, adminId);
  }
}

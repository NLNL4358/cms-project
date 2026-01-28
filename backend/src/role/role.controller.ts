import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('role:create', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '역할 생성',
    description: '새로운 역할을 생성합니다',
  })
  @ApiResponse({ status: 201, description: '역할 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (권한 형식 오류)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 409, description: '이미 존재하는 slug 또는 이름' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('role:read', 'role:*', '*')
  @ApiOperation({
    summary: '역할 목록 조회',
    description: '모든 역할을 조회합니다 (활성 사용자 수 포함)',
  })
  @ApiResponse({ status: 200, description: '역할 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('role:read', 'role:*', '*')
  @ApiOperation({
    summary: '역할 단일 조회',
    description: 'ID 또는 slug로 특정 역할을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '역할 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '역할을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('role:update', 'role:*', '*')
  @ApiOperation({
    summary: '역할 수정',
    description: 'ID 또는 slug로 역할을 수정합니다',
  })
  @ApiResponse({ status: 200, description: '역할 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (권한 형식 오류)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '역할을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 존재하는 slug 또는 이름' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('role:delete', 'role:*', '*')
  @ApiOperation({
    summary: '역할 삭제',
    description: 'ID 또는 slug로 역할을 삭제합니다 (활성 사용자가 없는 경우만)',
  })
  @ApiResponse({ status: 200, description: '역할 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '역할을 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '해당 역할을 사용 중인 사용자가 있음',
  })
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}

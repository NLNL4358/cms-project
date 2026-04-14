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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../role/guards/permissions.guard';
import { Permissions } from '../role/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserType } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('user:create', 'user:*', '*')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다',
  })
  @ApiResponse({ status: 201, description: '사용자 생성 성공' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 이메일' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('user:read', 'user:*', '*')
  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '모든 사용자를 조회합니다 (필터링, 페이지네이션 지원)',
  })
  @ApiQuery({ name: 'type', required: false, enum: UserType })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '조회 성공' })
  findAll(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({
      type,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('user:read', 'user:*', '*')
  @ApiOperation({
    summary: '사용자 단일 조회',
    description: 'ID로 특정 사용자를 조회합니다',
  })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('user:update', 'user:*', '*')
  @ApiOperation({
    summary: '사용자 수정',
    description: '사용자 정보를 수정합니다 (비밀번호, 역할 변경 포함)',
  })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 이메일' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.userService.update(id, updateUserDto, currentUserId);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('user:delete', 'user:*', '*')
  @ApiOperation({
    summary: '사용자 삭제',
    description: '사용자를 삭제합니다 (자기 자신은 삭제 불가)',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '자기 자신은 삭제할 수 없음' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  remove(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.userService.remove(id, currentUserId);
  }
}

/**
 * @description
 * 일반 회원(MEMBER) 인증 API
 * 외부 사용자 페이지에서 회원가입/로그인 시 사용
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EmailService } from '../../email/email.service';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Controller('public/auth')
export class MemberAuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /** 회원가입 (MEMBER 타입으로 자동 생성) */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    if (!body.email || !body.password || !body.name) {
      throw new BadRequestException('이메일, 비밀번호, 이름은 필수입니다');
    }
    if (body.password.length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다');
    }

    const user = await this.authService.register({
      email: body.email,
      password: body.password,
      name: body.name,
      type: UserType.MEMBER, // 항상 MEMBER로 강제
    });

    // 이메일 인증 토큰 생성 + 발송 (실패해도 가입은 성공)
    try {
      const token = await this.authService.createEmailVerifyToken(user.id);
      await this.emailService.sendEmailVerification(user.email, token, user.name);
    } catch {
      // 이메일 발송 실패는 무시 (사용자는 나중에 재발송 가능)
    }

    return user;
  }

  /** 로그인 */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  /** 토큰 갱신 */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  /** 로그아웃 */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  /** 내 정보 조회 */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        isActive: true,
        createdAt: true,
      },
    });
    return user;
  }

  /** 내 정보 수정 (이름, 비밀번호) */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; password?: string; currentPassword?: string },
  ) {
    const data: any = {};

    if (body.name) {
      data.name = body.name;
    }

    if (body.password) {
      if (!body.currentPassword) {
        throw new BadRequestException('현재 비밀번호를 입력하세요');
      }
      // 현재 비밀번호 검증
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('사용자를 찾을 수 없습니다');
      }
      const valid = await bcrypt.compare(body.currentPassword, user.password);
      if (!valid) {
        throw new BadRequestException('현재 비밀번호가 일치하지 않습니다');
      }
      if (body.password.length < 8) {
        throw new BadRequestException('비밀번호는 8자 이상이어야 합니다');
      }
      data.password = await bcrypt.hash(body.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, type: true },
    });
    return updated;
  }

  /** 비밀번호 재설정 요청 (이메일 발송) */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('이메일을 입력하세요');
    }

    const result = await this.authService.createPasswordResetToken(body.email);

    if (result) {
      try {
        await this.emailService.sendPasswordReset(
          result.user.email,
          result.token,
          result.user.name,
        );
      } catch {
        // 이메일 발송 실패는 무시 (보안상 동일 응답)
      }
    }

    // 보안: 이메일 존재 여부와 관계없이 동일 응답
    return { success: true, message: '이메일이 존재하면 재설정 링크가 발송되었습니다' };
  }

  /** 비밀번호 재설정 실행 */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: { token: string; password: string }) {
    if (!body.token || !body.password) {
      throw new BadRequestException('토큰과 새 비밀번호가 필요합니다');
    }
    return this.authService.resetPassword(body.token, body.password);
  }

  /** 이메일 인증 */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { token: string }) {
    if (!body.token) {
      throw new BadRequestException('인증 토큰이 필요합니다');
    }
    return this.authService.verifyEmail(body.token);
  }

  /** 이메일 인증 메일 재발송 */
  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 2 } })
  async resendVerification(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다');
    }
    if (user.isEmailVerified) {
      return { success: true, message: '이미 인증된 이메일입니다' };
    }

    const token = await this.authService.createEmailVerifyToken(user.id);
    await this.emailService.sendEmailVerification(user.email, token, user.name);

    return { success: true, message: '인증 메일이 재발송되었습니다' };
  }
}

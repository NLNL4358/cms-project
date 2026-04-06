import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, type } = registerDto;

    // 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        type,
      },
    });

    // 비밀번호 제외하고 반환
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // JWT 토큰 생성
    const tokens = await this.generateTokens(user.id, user.email);

    // Refresh Token을 DB에 저장
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + this.parseExpiration(refreshExpiresIn),
        ),
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async logout(userId: string) {
    // 해당 사용자의 모든 Refresh Token 삭제
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: '로그아웃되었습니다' };
  }

  async refresh(refreshTokenString: string) {
    try {
      // Refresh Token 검증
      const payload = await this.jwtService.verifyAsync(refreshTokenString, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const userId = payload.sub;

      // DB에서 저장된 Refresh Token 조회
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
      });

      // 저장된 토큰 중 하나라도 일치하는지 확인
      let isValidToken = false;
      for (const storedToken of storedTokens) {
        const isMatch = await bcrypt.compare(
          refreshTokenString,
          storedToken.token,
        );
        if (isMatch) {
          isValidToken = true;
          // 사용된 토큰 삭제 (Refresh Token Rotation)
          await this.prisma.refreshToken.deleteMany({
            where: { id: storedToken.id },
          });
          break;
        }
      }

      if (!isValidToken) {
        throw new UnauthorizedException('유효하지 않은 Refresh Token입니다');
      }

      // 사용자 조회
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새로운 토큰 발급
      const tokens = await this.generateTokens(user.id, user.email);

      // 새로운 Refresh Token을 DB에 저장
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
      await this.prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          userId: user.id,
          expiresAt: new Date(
            Date.now() + this.parseExpiration(refreshExpiresIn),
          ),
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다');
    }
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret'),
        expiresIn: this.configService.get('jwt.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // "7d", "30d" 형식을 밀리초로 변환
  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return value;
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * 비밀번호 재설정 토큰 생성 (이메일 발송은 컨트롤러에서)
   */
  async createPasswordResetToken(email: string): Promise<{ token: string; user: any } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 보안: 존재하지 않아도 동일하게 응답
      return null;
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    return { token, user };
  }

  /**
   * 토큰으로 비밀번호 재설정
   */
  async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new ConflictException('비밀번호는 8자 이상이어야 합니다');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // 모든 refresh token 무효화
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { success: true, message: '비밀번호가 변경되었습니다' };
  }

  /**
   * 이메일 인증 토큰 생성 (회원가입 시 호출)
   */
  async createEmailVerifyToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifyToken: token,
        emailVerifyExpiresAt: expiresAt,
      },
    });

    return token;
  }

  /**
   * 이메일 인증 토큰 검증
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('유효하지 않거나 만료된 인증 토큰입니다');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiresAt: null,
      },
    });

    return { success: true, message: '이메일이 인증되었습니다' };
  }
}

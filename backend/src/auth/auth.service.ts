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
          await this.prisma.refreshToken.delete({
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
}

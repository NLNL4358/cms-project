import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { decrypt } from '../common/utils/crypto.util';

interface EmailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string; // 암호화된 상태로 저장됨
  smtpSecure?: boolean;
  fromName?: string;
  fromEmail?: string;
  enabled?: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private settingsService: SettingsService) {}

  /** DB에서 SMTP 설정 읽기 */
  private async getEmailSettings(): Promise<EmailSettings> {
    const settings = await this.settingsService.findAll();
    return {
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || 587,
      smtpUser: settings.smtpUser || '',
      smtpPassword: settings.smtpPassword || '',
      smtpSecure: settings.smtpSecure || false,
      fromName: settings.fromName || 'CMS',
      fromEmail: settings.fromEmail || settings.smtpUser || '',
      enabled: settings.emailEnabled === true,
    };
  }

  /** Nodemailer transporter 생성 */
  private async createTransporter() {
    const config = await this.getEmailSettings();
    if (!config.enabled || !config.smtpHost || !config.smtpUser) {
      return null;
    }

    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: decrypt(config.smtpPassword || ''),
      },
    });
  }

  /**
   * 이메일 발송
   * SMTP 설정이 없으면 콘솔에 출력 (개발 폴백)
   */
  async send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; fallback?: boolean; error?: string }> {
    const config = await this.getEmailSettings();

    // SMTP 미설정 → 콘솔 폴백
    if (!config.enabled || !config.smtpHost) {
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.warn('📧 [개발 모드 — 이메일 콘솔 폴백]');
      this.logger.warn(`To: ${params.to}`);
      this.logger.warn(`Subject: ${params.subject}`);
      this.logger.warn(`Body: ${params.text || params.html.replace(/<[^>]*>/g, '')}`);
      this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true, fallback: true };
    }

    try {
      const transporter = await this.createTransporter();
      if (!transporter) {
        return { success: false, error: 'SMTP 설정이 올바르지 않습니다' };
      }

      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      this.logger.log(`이메일 발송 완료: ${params.to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`이메일 발송 실패: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /** 테스트 이메일 발송 (관리자가 SMTP 설정 검증용) */
  async sendTest(toEmail: string) {
    const config = await this.getEmailSettings();
    if (!config.enabled) {
      throw new BadRequestException('이메일 발송이 비활성화되어 있습니다');
    }
    if (!config.smtpHost || !config.smtpUser) {
      throw new BadRequestException('SMTP 설정을 먼저 입력하세요');
    }

    return this.send({
      to: toEmail,
      subject: '[CMS] 이메일 발송 테스트',
      html: `
        <h2>이메일 발송 테스트 성공 🎉</h2>
        <p>SMTP 설정이 정상적으로 작동합니다.</p>
        <p>발송 시각: ${new Date().toLocaleString('ko-KR')}</p>
      `,
    });
  }

  /** 비밀번호 재설정 이메일 */
  async sendPasswordReset(email: string, token: string, name: string) {
    const settings = await this.settingsService.findAll();
    const siteUrl = settings.siteUrl || 'http://localhost:5173';
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;

    return this.send({
      to: email,
      subject: '[CMS] 비밀번호 재설정 안내',
      html: `
        <h2>안녕하세요, ${name}님</h2>
        <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새 비밀번호를 설정하세요.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">비밀번호 재설정</a></p>
        <p>또는 이 링크를 복사하여 브라우저에 붙여넣으세요:</p>
        <p>${resetUrl}</p>
        <p style="color:#666;font-size:12px;">이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
      `,
    });
  }

  /** 이메일 인증 메일 */
  async sendEmailVerification(email: string, token: string, name: string) {
    const settings = await this.settingsService.findAll();
    const siteUrl = settings.siteUrl || 'http://localhost:5173';
    const verifyUrl = `${siteUrl}/verify-email?token=${token}`;

    return this.send({
      to: email,
      subject: '[CMS] 이메일 인증 안내',
      html: `
        <h2>환영합니다, ${name}님!</h2>
        <p>회원가입을 완료하려면 아래 링크를 클릭하여 이메일을 인증해주세요.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">이메일 인증</a></p>
        <p>또는 이 링크를 복사하여 브라우저에 붙여넣으세요:</p>
        <p>${verifyUrl}</p>
        <p style="color:#666;font-size:12px;">이 링크는 24시간 동안 유효합니다.</p>
      `,
    });
  }
}

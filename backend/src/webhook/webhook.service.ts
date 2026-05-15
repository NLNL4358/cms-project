import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        events: dto.events,
        secret: dto.secret || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook을 찾을 수 없습니다');
    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto) {
    await this.findOne(id);
    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.secret !== undefined && { secret: dto.secret }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.webhook.delete({ where: { id } });
  }

  /**
   * 이벤트 발생 시 활성 Webhook에 POST 요청 발송
   */
  async dispatch(event: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { isActive: true },
    });

    const matching = webhooks.filter((wh) => {
      const events = Array.isArray(wh.events) ? wh.events : [];
      return events.includes(event) || events.includes('*');
    });

    const results = await Promise.allSettled(
      matching.map((wh) => this.send(wh, event, payload)),
    );

    return results.map((r: PromiseSettledResult<any>, i: number) => ({
      webhookId: matching[i].id,
      status: r.status,
      error: r.status === 'rejected' ? (r as any).reason?.message : undefined,
    }));
  }

  /**
   * 테스트 발송
   */
  async test(id: string) {
    const webhook = await this.findOne(id);
    try {
      const result = await this.send(webhook, 'test', {
        message: 'Webhook 테스트 발송입니다.',
        timestamp: new Date().toISOString(),
      });
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Webhook 발송에 실패했습니다',
        url: webhook.url,
      };
    }
  }

  /** 실제 HTTP 요청 발송 */
  private async send(webhook: any, event: string, payload: any) {
    const isSlack = webhook.url.includes('hooks.slack.com');
    const isDiscord = webhook.url.includes('discord.com/api/webhooks');

    let bodyObj: any;

    if (isSlack) {
      // Slack 형식: { "text": "..." }
      const text = `[${event}] ${payload.message || payload.title || JSON.stringify(payload)}`;
      bodyObj = { text };
    } else if (isDiscord) {
      // Discord 형식: { "content": "..." }
      const content = `[${event}] ${payload.message || payload.title || JSON.stringify(payload)}`;
      bodyObj = { content };
    } else {
      // 범용 형식
      bodyObj = { event, data: payload, timestamp: new Date().toISOString() };
    }

    const body = JSON.stringify(bodyObj);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // HMAC 서명
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`Webhook 응답 실패: ${response.status} ${response.statusText}`);
    }

    return { status: response.status, webhookId: webhook.id };
  }
}

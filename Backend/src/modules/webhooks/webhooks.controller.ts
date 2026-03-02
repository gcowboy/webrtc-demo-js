import {
  Controller,
  Post,
  Req,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from '../../services/webhooks/webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly config: ConfigService,
    private readonly webhooks: WebhooksService,
  ) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async clerk(@Req() req: RawBodyRequest<Request>) {
    const secret = this.config.get<string>('CLERK_WEBHOOK_SIGNING_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Webhook signing secret not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body required for webhook verification');
    }

    const url = `${req.protocol}://${req.get('host') ?? ''}${req.originalUrl}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) headers.set(k.toLowerCase(), Array.isArray(v) ? v[0] : String(v));
    }
    const body = new Uint8Array(rawBody);
    const request = new Request(url, { method: req.method, headers, body });

    let evt;
    try {
      evt = await verifyWebhook(request, { signingSecret: secret });
    } catch {
      throw new BadRequestException('Invalid signature');
    }

    const result = await this.webhooks.handleClerkEvent(evt);
    if (!result.ok) {
      throw new InternalServerErrorException(result.error ?? 'Handler failed');
    }
    return { ok: true, action: result.action };
  }
}

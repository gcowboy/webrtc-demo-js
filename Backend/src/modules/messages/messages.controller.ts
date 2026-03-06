import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from '../../services/messages/messages.service';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { CurrentUserId } from '../../common/current-user-id.decorator';

@Controller('messages')
@UseGuards(ClerkAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  async list(@CurrentUserId() userId: string) {
    const result = await this.messages.listMessages(userId);
    if (result.error) {
      throw new BadRequestException(result.error);
    }
    return result.data ?? [];
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async send(
    @CurrentUserId() userId: string,
    @Body() body: { fromNumber?: string; to?: string; text?: string },
  ) {
    const fromNumber = body?.fromNumber?.trim();
    const to = body?.to?.trim();
    const text = body?.text?.trim() ?? '';
    if (!fromNumber || !to) {
      throw new BadRequestException('fromNumber and to are required');
    }
    const result = await this.messages.sendMessage(userId, fromNumber, to, text);
    if (result.error) {
      throw new BadRequestException(result.error);
    }
    return result.data ?? { id: '' };
  }
}

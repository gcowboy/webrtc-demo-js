import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelnyxClientService } from '../telnyx/telnyx-client.service';

export interface MessageItem {
  id: string;
  from: string;
  to: string;
  text: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telnyx: TelnyxClientService,
  ) {}

  /**
   * List messages from our DB (source of truth). Fast query by user_id.
   */
  async listMessages(userId: string): Promise<{ data?: MessageItem[]; error?: string }> {
    try {
      const rows = await this.prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      const items: MessageItem[] = rows.map((m) => ({
        id: m.id,
        from: m.fromNumber,
        to: m.toNumber,
        text: m.text,
        direction: m.direction as 'inbound' | 'outbound',
        createdAt: m.createdAt.toISOString(),
      }));
      return { data: items };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { error: message };
    }
  }

  /**
   * Store message in DB (source of truth), then send via Telnyx (delivery).
   */
  async sendMessage(
    userId: string,
    fromNumber: string,
    to: string,
    text: string,
  ): Promise<{ data?: { id: string }; error?: string }> {
    const trimmedFrom = fromNumber?.trim();
    const trimmedTo = to?.trim();
    const trimmedText = text?.trim();
    if (!trimmedFrom || !trimmedTo) {
      return { error: 'From number and recipient (to) are required.' };
    }
    if (!trimmedText) {
      return { error: 'Message text is required.' };
    }
    const number = await this.prisma.phoneNumber.findFirst({
      where: { userId, phoneNumber: trimmedFrom },
      select: { id: true },
    });
    if (!number) {
      return { error: 'The selected "from" number is not yours or was not found.' };
    }
    try {
      const row = await this.prisma.message.create({
        data: {
          userId,
          fromNumber: trimmedFrom,
          toNumber: trimmedTo,
          text: trimmedText,
          direction: 'outbound',
          media: [],
        },
      });
      const result = await this.telnyx.sendSms(trimmedFrom, trimmedTo, trimmedText);
      const telnyxId = result.data?.id ?? null;
      if (telnyxId) {
        await this.prisma.message.update({
          where: { id: row.id },
          data: { telnyxMessageId: telnyxId },
        });
      }
      return { data: { id: row.id } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      return { error: message };
    }
  }
}

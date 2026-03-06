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

  async listMessages(userId: string): Promise<{ data?: MessageItem[]; error?: string }> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId, type: 'message' },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      const items: MessageItem[] = notifications.map((n) => {
        const d = (n.data as { from?: string; to?: string; text?: string; direction?: string }) ?? {};
        return {
          id: n.id,
          from: d.from ?? '',
          to: d.to ?? '',
          text: n.message ?? d.text ?? '',
          direction: (d.direction as 'inbound' | 'outbound') ?? 'inbound',
          createdAt: n.createdAt.toISOString(),
        };
      });
      return { data: items };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database error';
      return { error: message };
    }
  }

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
      const result = await this.telnyx.sendSms(trimmedFrom, trimmedTo, trimmedText);
      const messageId = result.data?.id ?? '';
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'message',
          title: `SMS to ${trimmedTo}`,
          message: trimmedText.slice(0, 500),
          data: {
            from: trimmedFrom,
            to: trimmedTo,
            text: trimmedText,
            direction: 'outbound',
            smsId: messageId,
          },
        },
      });
      return { data: { id: messageId } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      return { error: message };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CLERK_ID_METADATA_KEY,
  DEFAULT_INSTANCE_ID_UUID,
  INSTANCE_ID_METADATA_KEY,
} from '../../constants/user.constants';
import { getInstanceIdUuid } from '../../helpers/uuid.helper';
import type { ClerkProfile } from '../../helpers/clerk.helper';
import { PrismaService } from '../../prisma/prisma.service';

export { INSTANCE_ID_METADATA_KEY } from '../../constants/user.constants';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Returns a UUID to store as instance_id in user record. */
  private getInstanceId(): string {
    const env = this.config.get<string>('INSTANCE_ID');
    return getInstanceIdUuid(env, DEFAULT_INSTANCE_ID_UUID);
  }

  async upsertUser(row: ClerkProfile): Promise<{ error: Error | null }> {
    try {
      const instanceIdUuid = this.getInstanceId();
      await this.prisma.user.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          email: row.email ?? null,
          username: row.username ?? null,
          fullName: row.full_name ?? null,
          avatarUrl: row.avatar_url ?? null,
          instanceId: instanceIdUuid,
        },
        update: {
          email: row.email ?? undefined,
          username: row.username ?? undefined,
          fullName: row.full_name ?? undefined,
          avatarUrl: row.avatar_url ?? undefined,
          instanceId: instanceIdUuid,
        },
      });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async deleteUser(clerkId: string): Promise<{ error: Error | null }> {
    try {
      await this.prisma.user.deleteMany({ where: { id: clerkId } });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async findById(clerkId: string): Promise<{
    id: string;
    telnyxCredentialConnectionId: string | null;
    telnyxMessagingProfileId: string | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: clerkId },
      select: { id: true, telnyxCredentialConnectionId: true, telnyxMessagingProfileId: true },
    } as {
      where: { id: string };
      select: { id: true; telnyxCredentialConnectionId: true; telnyxMessagingProfileId: true };
    });
    return user;
  }

  async updateCredentialConnectionId(
    clerkId: string,
    telnyxCredentialConnectionId: string | null,
  ): Promise<{ error: Error | null }> {
    try {
      await this.prisma.user.update({
        where: { id: clerkId },
        data: { telnyxCredentialConnectionId },
      } as { where: { id: string }; data: { telnyxCredentialConnectionId: string | null } });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async updateMessagingProfileId(
    clerkId: string,
    telnyxMessagingProfileId: string | null,
  ): Promise<{ error: Error | null }> {
    try {
      await this.prisma.user.update({
        where: { id: clerkId },
        data: { telnyxMessagingProfileId },
      } as { where: { id: string }; data: { telnyxMessagingProfileId: string | null } });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { WebhookEvent } from '@clerk/backend/webhooks';
import type { UserJSON } from '@clerk/types';
import { mapClerkUserToProfile } from '../../helpers/clerk.helper';
import { UserService } from '../userService/user.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly userService: UserService) {}

  async handleClerkEvent(evt: WebhookEvent): Promise<{ ok: boolean; action?: string; error?: string }> {
    if (evt.type === 'user.created') {
      const userData = mapClerkUserToProfile(evt.data as unknown as UserJSON);
      const { error } = await this.userService.upsertUser(userData);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'created' };
    }

    if (evt.type === 'user.updated') {
      const userData = mapClerkUserToProfile(evt.data as unknown as UserJSON);
      const { error } = await this.userService.upsertUser(userData);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'updated' };
    }

    if (evt.type === 'user.deleted') {
      const id = 'id' in evt.data ? evt.data.id : null;
      if (!id) return { ok: false, error: 'user.deleted payload missing id' };
      const { error } = await this.userService.deleteUser(id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, action: 'deleted' };
    }

    return { ok: true };
  }
}

import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ProfilesService } from './profiles.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, ProfilesService],
})
export class WebhooksModule {}

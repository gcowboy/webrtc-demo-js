import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { UserService } from '../../services/userService/user.service';
import { WebhooksService } from '../../services/webhooks/webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, UserService],
})
export class WebhooksModule {}

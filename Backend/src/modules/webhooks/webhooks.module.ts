import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { UserService } from '../../services/userService/user.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, UserService],
})
export class WebhooksModule {}

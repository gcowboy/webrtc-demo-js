import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { TelnyxModule } from '../telnyx/telnyx.module';
import { UserService } from '../../services/userService/user.service';
import { WebhooksService } from '../../services/webhooks/webhooks.service';

@Module({
  imports: [TelnyxModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, UserService],
})
export class WebhooksModule {}

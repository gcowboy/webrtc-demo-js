import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from '../../services/messages/messages.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TelnyxModule } from '../telnyx/telnyx.module';

@Module({
  imports: [PrismaModule, TelnyxModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}

import { Global, Module } from '@nestjs/common';
import { TelnyxClientService } from '../../services/telnyx/telnyx-client.service';

@Global()
@Module({
  providers: [TelnyxClientService],
  exports: [TelnyxClientService],
})
export class TelnyxModule {}

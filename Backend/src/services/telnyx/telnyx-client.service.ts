import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Telnyx from 'telnyx';

@Injectable()
export class TelnyxClientService {
  private readonly client: Telnyx;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('TELNYX_API_KEY') || '';
    this.client = new Telnyx({ apiKey });
  }

  getClient(): Telnyx {
    return this.client;
  }
}

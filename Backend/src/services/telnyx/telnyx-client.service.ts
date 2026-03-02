import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiClientService } from '../../common/base-api-client.service';
import { TELNYX_BASE_URL, TELNYX_DEFAULT_TIMEOUT_MS } from '../../constants/telnyx.constants';

@Injectable()
export class TelnyxClientService extends BaseApiClientService {
  constructor(private readonly config: ConfigService) {
    super({
      baseUrl: config.get<string>('TELNYX_BASE_URL') ?? TELNYX_BASE_URL,
      timeout: config.get<number>('TELNYX_TIMEOUT_MS') ?? TELNYX_DEFAULT_TIMEOUT_MS,
      getHeaders: (): Record<string, string> => {
        const apiKey = config.get<string>('TELNYX_API_KEY');
        if (!apiKey) {
          console.warn('TELNYX_API_KEY is not set. Telnyx API calls will fail.');
        }
        const headers: Record<string, string> = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        return headers;
      },
    });
  }
}

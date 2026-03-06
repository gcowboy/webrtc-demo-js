import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TopUpService } from '../../services/topUp/top-up.service';
import { ClerkAuthGuard, OptionalClerkAuthGuard } from '../../common/clerk-auth.guard';
import { CurrentUserId } from '../../common/current-user-id.decorator';

@Controller('top-up')
export class TopUpController {
  constructor(private readonly topUpService: TopUpService) {}

  @Get('admin-info')
  @UseGuards(OptionalClerkAuthGuard)
  async getAdminInfo(@CurrentUserId() userId?: string) {
    return this.topUpService.getAdminInfo(userId ?? undefined);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  async verify(
    @CurrentUserId() userId: string,
    @Body() body: { transactionId?: string },
  ) {
    const transactionId = body?.transactionId?.trim();
    if (!transactionId) {
      throw new BadRequestException('Transaction ID (hash) is required');
    }
    return this.topUpService.verifyAndCredit(userId, transactionId);
  }
}

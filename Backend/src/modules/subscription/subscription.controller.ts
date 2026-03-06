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
import { SubscriptionService } from '../../services/subscription/subscription.service';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { CurrentUserId } from '../../common/current-user-id.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async listPlans() {
    return this.subscriptionService.listPlans();
  }

  @Get('mine')
  @UseGuards(ClerkAuthGuard)
  async getMySubscription(@CurrentUserId() userId: string) {
    return this.subscriptionService.getActiveSubscription(userId);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ClerkAuthGuard)
  async subscribe(
    @CurrentUserId() userId: string,
    @Body() body: { planId?: string; useBalance?: boolean },
  ) {
    const planId = body?.planId?.trim();
    if (!planId) {
      throw new BadRequestException('planId is required');
    }
    return this.subscriptionService.subscribe(userId, planId, {
      useBalance: Boolean(body?.useBalance),
    });
  }
}

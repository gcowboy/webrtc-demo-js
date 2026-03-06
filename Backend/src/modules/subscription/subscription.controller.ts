import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from '../../services/subscription/subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async listPlans() {
    return this.subscriptionService.listPlans();
  }
}

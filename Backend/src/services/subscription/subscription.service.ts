import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(): Promise<
    { id: string; name: string; priceMonthly: number; maxPhoneNumbers: number; durationMonths: number }[]
  > {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { maxPhoneNumbers: 'asc' },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      priceMonthly: Number(p.priceMonthly),
      maxPhoneNumbers: p.maxPhoneNumbers,
      durationMonths: p.durationMonths,
    }));
  }

  /**
   * Get current active subscription for user (with plan details).
   */
  async getActiveSubscription(userId: string): Promise<{
    planId: string;
    planName: string;
    maxPhoneNumbers: number;
    endAt: string;
  } | null> {
    const now = new Date();
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, endAt: { gte: now } },
      orderBy: { endAt: 'desc' },
      include: { plan: true },
    });
    if (!sub?.plan) return null;
    return {
      planId: sub.plan.id,
      planName: sub.plan.name,
      maxPhoneNumbers: sub.plan.maxPhoneNumbers,
      endAt: sub.endAt.toISOString(),
    };
  }

  /**
   * Create a new subscription for the user. Optionally deduct from balance (priceMonthly * durationMonths).
   */
  async subscribe(
    userId: string,
    planId: string,
    options?: { useBalance?: boolean },
  ): Promise<{
    subscriptionId: string;
    planId: string;
    endAt: string;
  }> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setMonth(endAt.getMonth() + plan.durationMonths);

    if (options?.useBalance) {
      const total = Number(plan.priceMonthly) * plan.durationMonths;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      if (!user) throw new NotFoundException('User not found');
      const balance = Number(user.balance);
      if (balance < total) {
        throw new BadRequestException(
          `Insufficient balance. Need ${total} USDC (${plan.priceMonthly} × ${plan.durationMonths} months).`,
        );
      }
      const sub = await this.prisma.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          startAt,
          endAt,
        },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { balance: balance - total },
      });
      return {
        subscriptionId: sub.id,
        planId: plan.id,
        endAt: sub.endAt.toISOString(),
      };
    }

    const sub = await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        startAt,
        endAt,
      },
    });
    return {
      subscriptionId: sub.id,
      planId: plan.id,
      endAt: sub.endAt.toISOString(),
    };
  }
}

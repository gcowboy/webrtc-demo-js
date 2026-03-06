import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type PlanSummary = {
  id: string;
  name: string;
  priceMonthly: number;
  maxPhoneNumbers: number;
  durationMonths: number;
};

export type CanAddPhoneNumberResult =
  | { allowed: true; planId: string; maxPhoneNumbers: number }
  | { allowed: false; error: string };

export type ConsumeBalanceResult =
  | { ok: true; newBalance: number }
  | { ok: false; error: string };

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Use PrismaClient-typed access so subscription models are recognized (e.g. after prisma generate). */
  private get db(): PrismaClient {
    return this.prisma as unknown as PrismaClient;
  }

  async listPlans(): Promise<PlanSummary[]> {
    const plans = await this.db.subscriptionPlan.findMany({
      orderBy: { maxPhoneNumbers: 'asc' },
    });
    return plans.map((p: { id: string; name: string; priceMonthly: unknown; maxPhoneNumbers: number; durationMonths: number }) => ({
      id: p.id,
      name: p.name,
      priceMonthly: Number(p.priceMonthly),
      maxPhoneNumbers: p.maxPhoneNumbers,
      durationMonths: p.durationMonths,
    }));
  }

  /**
   * Check whether the user can add a phone number with the given plan (plan exists and balance >= plan priceMonthly).
   * Used when the user selects a plan for the number at purchase time.
   */
  async canAddPhoneNumberWithPlan(
    userId: string,
    planId: string,
  ): Promise<CanAddPhoneNumberResult> {
    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      return {
        allowed: false,
        error: `Plan "${planId}" not found. Choose a valid plan (e.g. basic, pro, business).`,
      };
    }
    const requiredBalance = Number(plan.priceMonthly);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    const balance = user?.balance != null ? Number(user.balance) : 0;
    if (balance < requiredBalance) {
      return {
        allowed: false,
        error: `Insufficient balance. Plan "${plan.name}" costs ${requiredBalance} USDC/month. Current balance: ${balance} USDC. Top up to add a phone number.`,
      };
    }
    return {
      allowed: true,
      planId: plan.id,
      maxPhoneNumbers: plan.maxPhoneNumbers,
    };
  }

  /**
   * Deduct the given plan's priceMonthly from the user's balance (when ordering a phone number with that plan).
   * The plan is applied to the phone number, not to the user.
   */
  async consumeBalanceForPlan(
    userId: string,
    planId: string,
  ): Promise<ConsumeBalanceResult> {
    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      return { ok: false, error: `Plan "${planId}" not found.` };
    }
    const amount = Number(plan.priceMonthly);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user) {
      return { ok: false, error: 'User not found.' };
    }
    const currentBalance = Number(user.balance);
    if (currentBalance < amount) {
      return {
        ok: false,
        error: `Insufficient balance. Need ${amount} USDC (plan price). Current: ${currentBalance} USDC.`,
      };
    }
    const newBalance = currentBalance - amount;
    await this.prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });
    return { ok: true, newBalance };
  }
}

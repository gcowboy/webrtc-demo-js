import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TelnyxClientService } from '../../services/telnyx/telnyx-client.service';

export interface AdminUsersListParams {
  skip?: number;
  take?: number;
  search?: string;
}

export interface AdminPhoneNumbersListParams {
  skip?: number;
  take?: number;
  userId?: string;
  unassignedOnly?: boolean;
}

export interface AdminTransactionsListParams {
  skip?: number;
  take?: number;
  userId?: string;
  status?: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telnyx: TelnyxClientService,
  ) {}

  async getStats() {
    const [userCount, phoneNumberCount, transactionCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.phoneNumber.count(),
      this.prisma.topUpTransaction.count(),
    ]);
    const verifiedSum = await this.prisma.topUpTransaction.aggregate({
      where: { status: 'verified' },
      _sum: { amount: true },
    });
    return {
      users: userCount,
      phoneNumbers: phoneNumberCount,
      topUpTransactions: transactionCount,
      totalTopUpVerified: verifiedSum._sum.amount ?? 0,
    };
  }

  async listUsers(params: AdminUsersListParams = {}) {
    const { skip = 0, take = 20, search } = params;
    const where: Prisma.UserWhereInput = {};
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where.OR = [
        { id: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { username: { contains: search.trim(), mode: 'insensitive' } },
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: Math.min(take, 100),
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          accountType: true,
          status: true,
          balance: true,
          updatedAt: true,
          _count: { select: { phoneNumbers: true, topUpTransactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, total };
  }

  async listPhoneNumbers(params: AdminPhoneNumbersListParams = {}) {
    const { skip = 0, take = 20, userId, unassignedOnly } = params;
    const where: Prisma.PhoneNumberWhereInput = {};
    if (unassignedOnly) {
      where.user = { is: null };
    } else if (userId !== undefined && userId !== '') {
      where.userId = userId;
    }
    const [data, total] = await Promise.all([
      this.prisma.phoneNumber.findMany({
        where,
        skip,
        take: Math.min(take, 100),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
      this.prisma.phoneNumber.count({ where }),
    ]);
    return { data, total };
  }

  async assignPhoneNumber(phoneNumberId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const phone = await this.prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      select: { id: true },
    });
    if (!phone) {
      throw new NotFoundException('Phone number not found.');
    }
    await this.prisma.phoneNumber.update({
      where: { id: phoneNumberId },
      data: { userId },
    });
    return { ok: true };
  }

  async unassignPhoneNumber(phoneNumberId: string) {
    const phone = await this.prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      select: { id: true },
    });
    if (!phone) {
      throw new NotFoundException('Phone number not found.');
    }
    await this.prisma.phoneNumber.update({
      where: { id: phoneNumberId },
      data: { user: { disconnect: true } },
    });
    return { ok: true };
  }

  /**
   * Fetches all phone numbers from Telnyx and upserts them into the PhoneNumber table.
   * Numbers not yet in DB are created with userId null (unassigned). Existing rows are updated.
   */
  async syncPhoneNumbersFromTelnyx(): Promise<{
    total: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    let created = 0;
    let updated = 0;
    let telnyxNumbers: { id: string; phone_number: string; country_iso_alpha2?: string }[];
    try {
      telnyxNumbers = await this.telnyx.listAllPhoneNumbers();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { total: 0, created: 0, updated: 0, error: `Telnyx list failed: ${message}` };
    }
    const countryCodeFromE164 = (e164: string): string => {
      const match = e164.match(/^\+(\d{1,3})/);
      return match ? match[1] : '';
    };
    for (const n of telnyxNumbers) {
      const phoneNumber = n.phone_number.trim();
      const countryCode = (n.country_iso_alpha2 ?? countryCodeFromE164(phoneNumber)).toUpperCase().slice(0, 2);
      let existing = await this.prisma.phoneNumber.findFirst({
        where: { telnyxNumberId: n.id },
        select: { id: true },
      });
      if (!existing) {
        existing = await this.prisma.phoneNumber.findFirst({
          where: { phoneNumber },
          select: { id: true },
        });
      }
      if (existing) {
        await this.prisma.phoneNumber.update({
          where: { id: existing.id },
          data: {
            telnyxNumberId: n.id,
            phoneNumber,
            countryCode: countryCode || undefined,
            rawTelnyxData: n as unknown as Prisma.InputJsonValue,
          },
        });
        updated += 1;
      } else {
        await this.prisma.phoneNumber.create({
          data: {
            telnyxNumberId: n.id,
            phoneNumber,
            countryCode: countryCode || '',
            userId: null,
            capabilities: [],
            monthlyCost: 0,
            rawTelnyxData: n as unknown as Prisma.InputJsonValue,
          },
        });
        created += 1;
      }
    }
    return { total: telnyxNumbers.length, created, updated };
  }

  async listTopUpTransactions(params: AdminTransactionsListParams = {}) {
    const { skip = 0, take = 20, userId, status } = params;
    const where: Prisma.TopUpTransactionWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.topUpTransaction.findMany({
        where,
        skip,
        take: Math.min(take, 100),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      }),
      this.prisma.topUpTransaction.count({ where }),
    ]);
    return { data, total };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AdminUsersListParams {
  skip?: number;
  take?: number;
  search?: string;
}

export interface AdminPhoneNumbersListParams {
  skip?: number;
  take?: number;
  userId?: string;
}

export interface AdminTransactionsListParams {
  skip?: number;
  take?: number;
  userId?: string;
  status?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { skip = 0, take = 20, userId } = params;
    const where: Prisma.PhoneNumberWhereInput = userId ? { userId } : {};
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

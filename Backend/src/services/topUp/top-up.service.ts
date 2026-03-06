import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { verifyPolygonUSDCTransaction } from '../../helpers/transaction-verification';

type WalletJson = { network: string; address: string } | null;

@Injectable()
export class TopUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get admin wallet, suggested amounts, and optionally current user balance.
   */
  async getAdminInfo(userId?: string): Promise<{
    adminWallet: { network: string; address: string };
    suggestedAmounts: number[];
    balance?: number;
  }> {
    const admin = await this.prisma.user.findFirst({
      where: { accountType: 'admin' },
      select: {
        wallet: true,
        individualRegAmount: true,
        teamRegAmount: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin configuration not found');
    }

    const wallet = admin.wallet as WalletJson;
    if (!wallet?.address || !wallet?.network) {
      throw new BadRequestException('Admin wallet is not configured');
    }

    const suggestedAmounts: number[] = [];
    if (admin.individualRegAmount != null) suggestedAmounts.push(Number(admin.individualRegAmount));
    if (admin.teamRegAmount != null) suggestedAmounts.push(Number(admin.teamRegAmount));
    if (suggestedAmounts.length === 0) suggestedAmounts.push(10, 50, 100);

    const out: {
      adminWallet: { network: string; address: string };
      suggestedAmounts: number[];
      balance?: number;
    } = {
      adminWallet: { network: wallet.network, address: wallet.address },
      suggestedAmounts: [...new Set(suggestedAmounts)].sort((a, b) => a - b),
    };

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      if (user) out.balance = Number(user.balance);
    }

    return out;
  }

  /**
   * Verify a USDC transfer to admin wallet and credit user balance. Any positive amount is accepted.
   */
  async verifyAndCredit(
    userId: string,
    transactionId: string,
  ): Promise<{
    success: true;
    message: string;
    balance: number;
    creditedAmount: number;
    transactionHash: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.topUpTransaction.findUnique({
      where: { txHash: transactionId },
    });
    if (existing) {
      throw new BadRequestException('This transaction has already been used');
    }

    const admin = await this.prisma.user.findFirst({
      where: { accountType: 'admin' },
      select: { wallet: true },
    });
    if (!admin) {
      throw new NotFoundException('Admin configuration not found');
    }

    const wallet = admin.wallet as WalletJson;
    if (!wallet?.address || !wallet?.network) {
      throw new BadRequestException('Admin wallet is not configured');
    }

    const minConfirmations =
      this.config.get<number>('TOPUP_MIN_CONFIRMATIONS') ?? 12;
    const verificationResult = await verifyPolygonUSDCTransaction(
      transactionId,
      wallet.address,
      wallet.network,
      minConfirmations,
    );

    if (!verificationResult.confirmed) {
      throw new BadRequestException(
        `Transaction needs more confirmations. Current: ${verificationResult.confirmations}, Required: ${verificationResult.requiredConfirmations}`,
      );
    }
    if (verificationResult.amount <= 0) {
      throw new BadRequestException('No valid payment amount found in transaction');
    }

    const amount = verificationResult.amount;
    const currentBalance = Number(user.balance);

    await this.prisma.$transaction([
      this.prisma.topUpTransaction.create({
        data: {
          userId,
          txHash: transactionId,
          amount,
          status: 'verified',
        } as { userId: string; txHash: string; amount: number; status: string },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: currentBalance + amount },
      }),
    ]);

    const newBalance = currentBalance + amount;

    return {
      success: true,
      message: `Successfully credited ${amount} USDC to your balance.`,
      balance: newBalance,
      creditedAmount: amount,
      transactionHash: transactionId,
    };
  }
}

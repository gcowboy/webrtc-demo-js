import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CLERK_USER_ID_KEY } from './clerk-auth.guard';
import { ACCOUNT_TYPE_ADMIN } from '../constants/user.constants';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Use after ClerkAuthGuard. Ensures the authenticated user has accountType === 'admin'.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = (request as Request & { [key: string]: string })[CLERK_USER_ID_KEY];
    if (!userId) {
      throw new ForbiddenException('Not authenticated.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true },
    });
    if (!user || user.accountType !== ACCOUNT_TYPE_ADMIN) {
      throw new ForbiddenException('Admin access required.');
    }
    return true;
  }
}

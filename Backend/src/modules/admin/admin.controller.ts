import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { AdminAuthGuard } from '../../common/admin-auth.guard';

function parsePage(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, n);
}

@Controller('admin')
@UseGuards(ClerkAuthGuard, AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async listUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({
      skip: parsePage(skip, 0),
      take: parsePage(take, 20),
      search,
    });
  }

  @Get('phone-numbers')
  async listPhoneNumbers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.listPhoneNumbers({
      skip: parsePage(skip, 0),
      take: parsePage(take, 20),
      userId,
    });
  }

  @Get('transactions')
  async listTransactions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listTopUpTransactions({
      skip: parsePage(skip, 0),
      take: parsePage(take, 20),
      userId,
      status,
    });
  }
}

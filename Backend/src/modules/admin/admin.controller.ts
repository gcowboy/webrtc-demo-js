import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminEnvAuthGuard } from '../../common/admin-env-auth.guard';

function parsePage(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, n);
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Post('auth/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.adminAuthService.login(email ?? '', password ?? '');
  }

  @Get('stats')
  @UseGuards(AdminEnvAuthGuard)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @UseGuards(AdminEnvAuthGuard)
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
  @UseGuards(AdminEnvAuthGuard)
  async listPhoneNumbers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('userId') userId?: string,
    @Query('unassignedOnly') unassignedOnly?: string,
  ) {
    return this.adminService.listPhoneNumbers({
      skip: parsePage(skip, 0),
      take: parsePage(take, 20),
      userId,
      unassignedOnly: unassignedOnly === 'true' || unassignedOnly === '1',
    });
  }

  @Post('phone-numbers/sync-from-telnyx')
  @UseGuards(AdminEnvAuthGuard)
  async syncPhoneNumbersFromTelnyx() {
    return this.adminService.syncPhoneNumbersFromTelnyx();
  }

  @Patch('phone-numbers/:id')
  @UseGuards(AdminEnvAuthGuard)
  async updatePhoneNumber(
    @Param('id') id: string,
    @Body('action') action: string,
    @Body('userId') userId?: string,
  ) {
    if (action === 'unassign') {
      return this.adminService.unassignPhoneNumber(id);
    }
    if (action === 'assign' && userId) {
      return this.adminService.assignPhoneNumber(id, userId);
    }
    throw new BadRequestException('Invalid action: use "assign" with userId or "unassign"');
  }

  @Get('transactions')
  @UseGuards(AdminEnvAuthGuard)
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

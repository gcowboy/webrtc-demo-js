import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminEnvAuthGuard } from '../../common/admin-env-auth.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminAuthService, AdminEnvAuthGuard],
  exports: [AdminService],
})
export class AdminModule {}

import { Global, Module } from '@nestjs/common';
import { SupabaseAdminService } from '../../services/supabase/supabase-admin.service';

@Global()
@Module({
  providers: [SupabaseAdminService],
  exports: [SupabaseAdminService],
})
export class SupabaseModule {}

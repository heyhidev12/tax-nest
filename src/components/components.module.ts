import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
  imports: [AuthModule, MembersModule, ConsultationsModule, AdminAuthModule],
})
export class ComponentsModule {}

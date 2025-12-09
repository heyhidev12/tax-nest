import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MembersModule } from '../members/members.module';
import { VerificationModule } from '../verification/verification.module';
import { JwtStrategy } from './jwt.strategy';
import { Member } from 'src/libs/entity/member.entity';

@Module({
  imports: [
    MembersModule,
    VerificationModule,
    TypeOrmModule.forFeature([Member]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

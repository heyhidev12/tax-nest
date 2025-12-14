import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MembersModule } from '../members/members.module';
import { VerificationModule } from '../verification/verification.module';
import { ContentModule } from '../content/content.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { JwtStrategy } from './jwt.strategy';
import { Member } from 'src/libs/entity/member.entity';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';

@Module({
  imports: [
    MembersModule,
    VerificationModule,
    ContentModule,
    ConsultationsModule,
    NewsletterModule,
    TypeOrmModule.forFeature([Member]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),

    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    OAuthService,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}

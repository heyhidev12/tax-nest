import { webcrypto } from 'crypto';

if (!(global as any).crypto) {
  (global as any).crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AdminAuthService } from './components/admin-auth/admin-auth.service';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Enable cookie parser
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Tax Firm Together API')
    .setDescription('세무법인 투게더 백오피스 API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'user-auth',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'admin-auth',
    )
    // User/Public APIs (ordered first)
    .addTag('Auth', '회원 인증')
    .addTag('Consultations', '상담 요청')
    .addTag('Newsletter', '뉴스레터')
    .addTag('Content', '콘텐츠 조회')
    .addTag('Attachments', '첨부파일 다운로드')
    // Admin APIs (ordered after user APIs)
    .addTag('Admin Uploads', '관리자 - 파일 업로드 (이미지/비디오)')
    .addTag('Admin Attachments', '관리자 - 첨부파일 관리')
    .addTag('Admin Auth', '관리자 인증')
    .addTag('Admin Consultations', '관리자 - 상담 관리')
    .addTag('Admin Members', '관리자 - 회원 관리')
    .addTag('Admin Settings', '관리자 - 설정')
    .addTag('Admin Newsletter', '관리자 - 뉴스레터')
    .addTag('Admin Content', '관리자 - 콘텐츠 관리')
    .addTag('Admin Comments', '관리자 - 댓글 관리')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server first (non-blocking)
  const port = process.env.PORT ?? 3002;
  const host = '0.0.0.0';

  await app.listen(port, host);
  console.log(`🚀 Application is running on: http://${host}:${port}`);
  console.log(`📚 Swagger docs: http://${host}:${port}/api/docs`);

  // Seed super admin asynchronously (non-blocking)
  const adminService = app.get(AdminAuthService);
  adminService.seedSuperAdmin().catch(err => {
    console.error('❌ Failed to seed super admin:', err.message);
  });
}
bootstrap();

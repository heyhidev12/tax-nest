import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AdminAuthService } from './components/admin-auth/admin-auth.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Enable CORS
  app.enableCors();

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
    .addTag('Auth', '회원 인증')
    .addTag('Consultations', '상담 요청')
    .addTag('Newsletter', '뉴스레터')
    .addTag('Admin Auth', '관리자 인증')
    .addTag('Admin Consultations', '관리자 - 상담 관리')
    .addTag('Admin Members', '관리자 - 회원 관리')
    .addTag('Admin Settings', '관리자 - 설정')
    .addTag('Admin Newsletter', '관리자 - 뉴스레터')
    .addTag('Admin Content', '관리자 - 콘텐츠 관리')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Seed super admin on startup
  const adminService = app.get(AdminAuthService);
  await adminService.seedSuperAdmin();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger docs: ${await app.getUrl()}/api/docs`);
}
bootstrap();

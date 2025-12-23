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
    .addTag('Auth', '회원 인증')
    .addTag('Consultations', '상담 요청')
    .addTag('Newsletter', '뉴스레터')
    .addTag('Upload', '파일 업로드 (이미지/비디오)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Filter out all admin-related paths from Swagger documentation
  if (document.paths) {
    Object.keys(document.paths).forEach((path) => {
      if (path.startsWith('/admin')) {
        delete document.paths[path];
      }
    });
  }
  
  SwaggerModule.setup('api/docs', app, document);

  // Seed super admin on startup
  const adminService = app.get(AdminAuthService);
  await adminService.seedSuperAdmin();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger docs: ${await app.getUrl()}/api/docs`);
}
bootstrap();

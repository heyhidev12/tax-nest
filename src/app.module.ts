// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentsModule } from './components/components.module';
import { RedisModule } from './libs/redis/redis.module';
import { UploadModule } from './libs/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env',
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        autoLoadEntities: true,
        synchronize: true,
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        connectTimeout: 10000, // 10 seconds
        acquireTimeout: 10000,
        extra: {
          connectionLimit: 10,
        },
      }),
    }),
    RedisModule,
    UploadModule,
    ComponentsModule,
  ],
})
export class AppModule { }

import { Module, Global } from '@nestjs/common';
import { UploadService } from './upload.service';

@Global()
@Module({
  controllers: [],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}

import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (jpg, png, webp). Maximum size: 5MB',
  })
  file: any;
}

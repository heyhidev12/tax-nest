import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConsultationStatus } from 'src/libs/enums/consultations.enum';

export class AdminAnswerDto {
  @ApiProperty({ example: '상담 답변 내용입니다.', description: '답변 내용' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ example: 'COMPLETED', enum: ConsultationStatus, description: '상담 상태' })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;
}


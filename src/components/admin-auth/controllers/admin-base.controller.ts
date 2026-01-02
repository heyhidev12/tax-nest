import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiBearerAuth('admin-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminBaseController { }

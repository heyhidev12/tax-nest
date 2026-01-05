import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExposureSettingsService } from '../content/services/exposure-settings.service';

@ApiTags('Newsletter')
@Controller('newsletter-page')
export class NewsletterPageController {
    constructor(
        private readonly exposureSettingsService: ExposureSettingsService,
    ) { }

    @ApiOperation({ summary: '뉴스레터 페이지 노출 여부 조회' })
    @ApiResponse({
        status: 200,
        description: '노출 여부 반환',
        schema: {
            type: 'object',
            properties: {
                isExposed: { type: 'boolean', description: '페이지 노출 여부' },
            },
        },
    })
    @Get()
    async getPageVisibility() {
        const isExposed = await this.exposureSettingsService.isNewsletterPageExposed();
        return { isExposed };
    }
}

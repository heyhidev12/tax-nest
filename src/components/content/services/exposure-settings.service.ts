import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExposureSettings } from 'src/libs/entity/exposure-settings.entity';

@Injectable()
export class ExposureSettingsService {
  constructor(
    @InjectRepository(ExposureSettings)
    private readonly settingsRepo: Repository<ExposureSettings>,
  ) {}

  async get(key: string): Promise<Record<string, any> | null> {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async set(key: string, value: Record<string, any>) {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
    } else {
      setting = this.settingsRepo.create({ key, value });
    }
    await this.settingsRepo.save(setting);
    return { success: true };
  }

  async getAll() {
    const settings = await this.settingsRepo.find();
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  // 편의 메서드들
  async isAwardsMainExposed(): Promise<boolean> {
    const value = await this.get('awards_main');
    return value?.isExposed?? false; // Default: N (false)
  }

  async setAwardsMainExposed(isExposed: boolean) {
    return this.set('awards_main', { isExposed});
  }

  async isNewsletterPageExposed(): Promise<boolean> {
    const value = await this.get('newsletter_page');
    return value?.isExposed?? false; // Default: N (false)
  }

  async setNewsletterPageExposed(isExposed: boolean) {
    return this.set('newsletter_page', { isExposed});
  }

  async isHistoryPageExposed(): Promise<boolean> {
    const value = await this.get('history_page');
    return value?.isExposed?? false; // Default: N (false)
  }

  async setHistoryPageExposed(isExposed: boolean) {
    return this.set('history_page', { isExposed});
  }
}




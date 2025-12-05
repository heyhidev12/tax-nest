import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';

interface SubscriberListOptions {
  search?: string;
  isSubscribed?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
  ) {}

  // POST /newsletter/subscribe
  async subscribe(email: string) {
    // 이미 구독 중인지 확인
    const existing = await this.subscriberRepo.findOne({ where: { email } });
    
    if (existing) {
      if (existing.isSubscribed) {
        throw new ConflictException('이미 구독 중인 이메일입니다.');
      }
      // 구독 취소했던 경우 다시 구독
      existing.isSubscribed = true;
      existing.unsubscribedAt = null;
      await this.subscriberRepo.save(existing);
      return { success: true, message: '뉴스레터 구독이 재개되었습니다.' };
    }

    // 새로운 구독자
    const subscriber = this.subscriberRepo.create({ email });
    await this.subscriberRepo.save(subscriber);
    return { success: true, message: '뉴스레터 구독이 완료되었습니다.' };
  }

  // 구독 취소
  async unsubscribe(email: string) {
    const subscriber = await this.subscriberRepo.findOne({ where: { email } });
    if (!subscriber || !subscriber.isSubscribed) {
      return { success: true, message: '구독 중이 아닙니다.' };
    }

    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await this.subscriberRepo.save(subscriber);
    return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
  }

  // GET /admin/newsletter - 관리자용 구독자 목록
  async adminList(options: SubscriberListOptions = {}) {
    const { search, isSubscribed, page = 1, limit = 20 } = options;
    
    const where: any = {};
    
    if (isSubscribed !== undefined) {
      where.isSubscribed = isSubscribed;
    }

    if (search) {
      where.email = Like(`%${search}%`);
    }

    const [items, total] = await this.subscriberRepo.findAndCount({
      where,
      order: { subscribedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  // 구독 상태 토글
  async toggleSubscription(id: number) {
    const subscriber = await this.subscriberRepo.findOne({ where: { id } });
    if (!subscriber) {
      return { success: false, message: '구독자를 찾을 수 없습니다.' };
    }

    subscriber.isSubscribed = !subscriber.isSubscribed;
    if (!subscriber.isSubscribed) {
      subscriber.unsubscribedAt = new Date();
    } else {
      subscriber.unsubscribedAt = null;
    }

    await this.subscriberRepo.save(subscriber);
    return { success: true, isSubscribed: subscriber.isSubscribed };
  }
}


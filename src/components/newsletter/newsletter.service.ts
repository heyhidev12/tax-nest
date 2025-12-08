import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';

interface SubscriberListOptions {
  search?: string;
  isSubscribed?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
  ) {}

  // POST /newsletter/subscribe - 뉴스레터 구독 (이름 + 이메일)
  async subscribe(name: string | undefined, email: string) {
    // 이미 구독 중인지 확인
    const existing = await this.subscriberRepo.findOne({ where: { email } });
    
    if (existing) {
      if (existing.isSubscribed) {
        throw new ConflictException('이미 구독 중인 이메일입니다.');
      }
      // 구독 취소했던 경우 다시 구독
      if (name) existing.name = name;
      existing.isSubscribed = true;
      existing.unsubscribedAt = null;
      await this.subscriberRepo.save(existing);
      return { success: true, message: '뉴스레터 구독이 재개되었습니다.' };
    }

    // 새로운 구독자
    const subscriber = this.subscriberRepo.create({ name, email });
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
    const { search, isSubscribed, sort = 'latest', page = 1, limit = 20 } = options;
    
    const qb = this.subscriberRepo.createQueryBuilder('subscriber');

    // 수신 여부 필터
    if (isSubscribed !== undefined) {
      qb.andWhere('subscriber.isSubscribed = :isSubscribed', { isSubscribed });
    }

    // 이메일 검색
    if (search) {
      qb.andWhere('subscriber.email LIKE :search', { search: `%${search}%` });
    }

    // 정렬 (기본: 최신순)
    qb.orderBy('subscriber.subscribedAt', sort === 'latest' ? 'DESC' : 'ASC');

    // 페이지네이션
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // 응답 포맷
    const formattedItems = items.map((item, index) => ({
      no: total - ((page - 1) * limit + index),
      id: item.id,
      name: item.name || '-',
      email: item.email,
      isSubscribed: item.isSubscribed,
      subscriptionLabel: item.isSubscribed ? 'Y' : 'N',
      subscribedAt: item.subscribedAt,
      subscribedAtFormatted: this.formatDateTime(item.subscribedAt),
      unsubscribedAt: item.unsubscribedAt,
      unsubscribedAtFormatted: item.unsubscribedAt ? this.formatDateTime(item.unsubscribedAt) : null,
    }));

    return { items: formattedItems, total, page, limit };
  }

  // 구독자 상세 조회
  async findById(id: number) {
    const subscriber = await this.subscriberRepo.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }
    return {
      ...subscriber,
      subscriptionLabel: subscriber.isSubscribed ? 'Y' : 'N',
      subscribedAtFormatted: this.formatDateTime(subscriber.subscribedAt),
      unsubscribedAtFormatted: subscriber.unsubscribedAt ? this.formatDateTime(subscriber.unsubscribedAt) : null,
    };
  }

  // 구독 상태 토글
  async toggleSubscription(id: number) {
    const subscriber = await this.subscriberRepo.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }

    subscriber.isSubscribed = !subscriber.isSubscribed;
    if (!subscriber.isSubscribed) {
      subscriber.unsubscribedAt = new Date();
    } else {
      subscriber.unsubscribedAt = null;
    }

    await this.subscriberRepo.save(subscriber);
    return { 
      success: true, 
      isSubscribed: subscriber.isSubscribed,
      subscriptionLabel: subscriber.isSubscribed ? 'Y' : 'N',
    };
  }

  // 구독자 삭제
  async delete(id: number) {
    const subscriber = await this.subscriberRepo.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }
    await this.subscriberRepo.remove(subscriber);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  // 구독자 다중 삭제
  async deleteMany(ids: number[]) {
    const subscribers = await this.subscriberRepo.find({ where: { id: In(ids) } });
    if (!subscribers.length) return { success: true, deleted: 0 };
    await this.subscriberRepo.remove(subscribers);
    return { success: true, deleted: subscribers.length, message: '삭제가 완료되었습니다.' };
  }

  // 날짜 포맷 헬퍼 (yyyy.MM.dd HH:mm:ss)
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }
}

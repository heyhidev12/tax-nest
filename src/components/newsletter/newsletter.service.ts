import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { Member } from 'src/libs/entity/member.entity';
import { EasyMailService } from './services/easy-mail.service';

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
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    private readonly easyMailService: EasyMailService,
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

  // GET /admin/newsletter - 관리자용 구독자 목록 (Easy Mail에서 가져오기)
  async adminList(options: SubscriberListOptions = {}) {
    const { search, isSubscribed, sort = 'latest', page = 1, limit = 20 } = options;
    
    try {
      // Easy Mail에서 구독자 목록 가져오기
      const easyMailResponse = await this.easyMailService.getSubscribers({
        search,
        subscribed: isSubscribed,
        page,
        limit,
      });

      // Easy Mail 응답을 포맷팅
      let formattedItems = easyMailResponse.subscribers.map((subscriber, index) => {
        const subscribedAt = subscriber.subscribedAt 
          ? (typeof subscriber.subscribedAt === 'string' ? new Date(subscriber.subscribedAt) : subscriber.subscribedAt)
          : new Date();
        const unsubscribedAt = subscriber.unsubscribedAt
          ? (typeof subscriber.unsubscribedAt === 'string' ? new Date(subscriber.unsubscribedAt) : subscriber.unsubscribedAt)
          : null;

        return {
          no: easyMailResponse.total - ((page - 1) * limit + index),
          id: subscriber.id,
          name: subscriber.name || '-',
          email: subscriber.email,
          isSubscribed: subscriber.subscribed,
          subscriptionLabel: subscriber.subscribed ? 'Y' : 'N',
          subscribedAt: subscribedAt,
          subscribedAtFormatted: this.formatDateTime(subscribedAt),
          unsubscribedAt: unsubscribedAt,
          unsubscribedAtFormatted: unsubscribedAt ? this.formatDateTime(unsubscribedAt) : null,
        };
      });

      // 정렬 (Easy Mail에서 정렬이 안되면 여기서 정렬)
      if (sort === 'latest') {
        formattedItems.sort((a, b) => 
          new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
        );
      } else if (sort === 'oldest') {
        formattedItems.sort((a, b) => 
          new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime()
        );
      }

      // 검색 결과 없음 메시지 처리
      const hasSearchQuery = !!search;
      const hasNoResults = formattedItems.length === 0;

      return { 
        items: formattedItems, 
        total: easyMailResponse.total, 
        page, 
        limit,
        message: hasSearchQuery && hasNoResults ? '검색 결과 없음' : undefined,
      };
    } catch (error: any) {
      // Easy Mail API 오류 시 빈 결과 반환 (fallback)
      return {
        items: [],
        total: 0,
        page,
        limit,
        message: search ? '검색 결과 없음' : undefined,
      };
    }
  }

  // 구독자 상세 조회 (Easy Mail에서 가져오기)
  async findById(id: number | string) {
    try {
      const subscriber = await this.easyMailService.getSubscriberById(id);
      if (!subscriber) {
        throw new NotFoundException('구독자를 찾을 수 없습니다.');
      }

      const subscribedAt = subscriber.subscribedAt 
        ? (typeof subscriber.subscribedAt === 'string' ? new Date(subscriber.subscribedAt) : subscriber.subscribedAt)
        : new Date();
      const unsubscribedAt = subscriber.unsubscribedAt
        ? (typeof subscriber.unsubscribedAt === 'string' ? new Date(subscriber.unsubscribedAt) : subscriber.unsubscribedAt)
        : null;

      return {
        id: subscriber.id,
        name: subscriber.name || '-',
        email: subscriber.email,
        isSubscribed: subscriber.subscribed,
        subscriptionLabel: subscriber.subscribed ? 'Y' : 'N',
        subscribedAt: subscribedAt,
        subscribedAtFormatted: this.formatDateTime(subscribedAt),
        unsubscribedAt: unsubscribedAt,
        unsubscribedAtFormatted: unsubscribedAt ? this.formatDateTime(unsubscribedAt) : null,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }
  }

  // 구독 상태 토글 (Easy Mail에서 업데이트)
  async toggleSubscription(id: number | string) {
    try {
      // 현재 상태 조회
      const currentSubscriber = await this.easyMailService.getSubscriberById(id);
      if (!currentSubscriber) {
        throw new NotFoundException('구독자를 찾을 수 없습니다.');
      }

      // 상태 토글
      const newSubscribedStatus = !currentSubscriber.subscribed;
      const updatedSubscriber = await this.easyMailService.toggleSubscription(id, newSubscribedStatus);

      return { 
        success: true, 
        isSubscribed: updatedSubscriber.subscribed,
        subscriptionLabel: updatedSubscriber.subscribed ? 'Y' : 'N',
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }
  }

  // 구독자 삭제 (Easy Mail에서 삭제)
  async delete(id: number | string) {
    try {
      await this.easyMailService.deleteSubscriber(id);
      return { success: true, message: '삭제가 완료되었습니다.' };
    } catch (error: any) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }
  }

  // 구독자 다중 삭제 (Easy Mail에서 삭제)
  async deleteMany(ids: (number | string)[]) {
    let deletedCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        await this.easyMailService.deleteSubscriber(id);
        deletedCount++;
      } catch (error: any) {
        errors.push(`ID ${id}: ${error.message}`);
      }
    }

    if (deletedCount === 0) {
      return { success: true, deleted: 0, message: '삭제된 항목이 없습니다.' };
    }

    return { 
      success: true, 
      deleted: deletedCount, 
      message: `삭제가 완료되었습니다. (${deletedCount}/${ids.length})`,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // GET /newsletter/me - 회원의 뉴스레터 구독 정보 조회
  async getMemberSubscription(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    return {
      email: member.email,
      isSubscribed: member.newsletterSubscribed,
      subscriptionLabel: member.newsletterSubscribed ? 'Y' : 'N',
    };
  }

  // POST /newsletter/me/unsubscribe - 회원의 뉴스레터 구독 취소
  async unsubscribeMember(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    
    if (!member.newsletterSubscribed) {
      return { success: true, message: '이미 구독 취소된 상태입니다.' };
    }

    member.newsletterSubscribed = false;
    await this.memberRepo.save(member);
    return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
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

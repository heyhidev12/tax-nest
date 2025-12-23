import { Injectable, ConflictException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { Member } from 'src/libs/entity/member.entity';
import { MAIL_PROVIDER_TOKEN } from './services/mail-provider.interface';
import type { MailProvider } from './services/mail-provider.interface';

interface SubscriberListOptions {
  search?: string;
  isSubscribed?: boolean;
  sort?: 'latest' | 'oldest';
  page?: number;
  limit?: number;
}

interface SendNewsletterOptions {
  subject: string;
  html: string;
  target: 'ALL' | 'MEMBERS' | 'SUBSCRIBERS';
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscriber)
    private readonly subscriberRepo: Repository<NewsletterSubscriber>,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @Inject(MAIL_PROVIDER_TOKEN)
    private readonly mailProvider: MailProvider,
  ) {}

  // POST /newsletter/subscribe - 뉴스레터 구독 (이름 + 이메일)
  async subscribe(name: string | undefined, email: string) {
    const existing = await this.subscriberRepo.findOne({ where: { email } });

    if (existing && existing.isSubscribed) {
      throw new ConflictException('이미 구독 중인 이메일입니다.');
    }

    if (existing) {
      existing.name = name ?? existing.name;
      existing.isSubscribed = true;
      existing.unsubscribedAt = null;
      existing.isMailSynced = true;
      await this.subscriberRepo.save(existing);
    } else {
      const subscriber = this.subscriberRepo.create({
        email,
        isSubscribed: true,
        isMailSynced: true,
        unsubscribedAt: null,
      });
      if (name) {
        subscriber.name = name;
      }
      await this.subscriberRepo.save(subscriber);
    }

    try {
      // 외부 메일 제공자에 구독 반영
      await this.mailProvider.subscribe(email, name);
      return { success: true, message: '뉴스레터 구독이 완료되었습니다.' };
    } catch (error: any) {
      this.logger.error(`메일 제공자 구독 반영 실패 (${email}): ${error?.message || error}`);
      // DB는 이미 구독 상태로 반영되어 있으므로, 동기화 플래그를 끄고 성공으로 응답
      await this.subscriberRepo.update({ email }, { isMailSynced: false });
      return { success: true, message: '뉴스레터 구독이 완료되었습니다. (메일 발송 설정은 나중에 동기화될 수 있습니다.)' };
    }
  }

  // 구독 취소 - Easy Mail API 사용
  async unsubscribe(email: string) {
    const existing = await this.subscriberRepo.findOne({ where: { email } });
    if (existing) {
      existing.isSubscribed = false;
      existing.unsubscribedAt = new Date();
      existing.isMailSynced = true;
      await this.subscriberRepo.save(existing);
    }

    try {
      await this.mailProvider.unsubscribe(email);
      return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
    } catch (error: any) {
      this.logger.error(`메일 제공자 구독 취소 반영 실패 (${email}): ${error?.message || error}`);
      if (existing) {
        await this.subscriberRepo.update({ email }, { isMailSynced: false });
      }
      // 외부 API 실패 시에도 DB를 기준으로 성공 처리
      return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
    }
  }

  // GET /admin/newsletter - 관리자용 구독자 목록 (DB 기준)
  async adminList(options: SubscriberListOptions = {}) {
    const { search, isSubscribed, sort = 'latest', page = 1, limit = 20 } = options;
    const qb = this.subscriberRepo.createQueryBuilder('s');

    if (search) {
      qb.andWhere('s.email LIKE :search OR s.name LIKE :search', { search: `%${search}%` });
    }

    if (isSubscribed !== undefined) {
      qb.andWhere('s.isSubscribed = :isSubscribed', { isSubscribed });
    }

    if (sort === 'oldest') {
      qb.orderBy('s.subscribedAt', 'ASC');
    } else {
      qb.orderBy('s.subscribedAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const formattedItems = items.map((subscriber, index) => {
      const subscribedAt = subscriber.subscribedAt || new Date();
      const unsubscribedAt = subscriber.unsubscribedAt || null;
      return {
        no: total - ((page - 1) * limit + index),
        id: subscriber.id,
        name: subscriber.name || '-',
        email: subscriber.email,
        isSubscribed: subscriber.isSubscribed,
        subscriptionLabel: subscriber.isSubscribed ? 'Y' : 'N',
        subscribedAt,
        subscribedAtFormatted: this.formatDateTime(subscribedAt),
        unsubscribedAt,
        unsubscribedAtFormatted: unsubscribedAt ? this.formatDateTime(unsubscribedAt) : null,
        isMailSynced: subscriber.isMailSynced,
      };
    });

    const hasSearchQuery = !!search;
    const hasNoResults = formattedItems.length === 0;

    return {
      items: formattedItems,
      total,
      page,
      limit,
      message: hasSearchQuery && hasNoResults ? '검색 결과 없음' : undefined,
    };
  }

  // 구독자 상세 조회 (DB 기준)
  async findById(id: number | string) {
    const numericId = typeof id === 'string' ? Number(id) : id;
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: numericId as number },
    });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }

    const subscribedAt = subscriber.subscribedAt || new Date();
    const unsubscribedAt = subscriber.unsubscribedAt || null;

    return {
      id: subscriber.id,
      name: subscriber.name || '-',
      email: subscriber.email,
      isSubscribed: subscriber.isSubscribed,
      subscriptionLabel: subscriber.isSubscribed ? 'Y' : 'N',
      subscribedAt,
      subscribedAtFormatted: this.formatDateTime(subscribedAt),
      unsubscribedAt,
      unsubscribedAtFormatted: unsubscribedAt ? this.formatDateTime(unsubscribedAt) : null,
      isMailSynced: subscriber.isMailSynced,
    };
  }

  // 구독 상태 토글 (DB + 외부 제공자 동기화)
  async toggleSubscription(id: number | string) {
    const numericId = typeof id === 'string' ? Number(id) : id;
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: numericId as number },
    });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }

    const newSubscribedStatus = !subscriber.isSubscribed;
    subscriber.isSubscribed = newSubscribedStatus;
    subscriber.unsubscribedAt = newSubscribedStatus ? null : new Date();
    subscriber.isMailSynced = true;
    await this.subscriberRepo.save(subscriber);

    try {
      if (newSubscribedStatus) {
        await this.mailProvider.subscribe(subscriber.email, subscriber.name || undefined);
      } else {
        await this.mailProvider.unsubscribe(subscriber.email);
      }
    } catch (error: any) {
      this.logger.error(
        `메일 제공자 토글 반영 실패 (${subscriber.email} -> ${newSubscribedStatus}): ${error?.message || error}`,
      );
      subscriber.isMailSynced = false;
      await this.subscriberRepo.save(subscriber);
    }

    return {
      success: true,
      isSubscribed: subscriber.isSubscribed,
      subscriptionLabel: subscriber.isSubscribed ? 'Y' : 'N',
    };
  }

  // 구독자 삭제 (DB 기준, 외부 제공자는 best-effort)
  async delete(id: number | string) {
    const numericId = typeof id === 'string' ? Number(id) : id;
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: numericId as number },
    });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }

    // 외부 제공자에서 먼저 구독 취소 시도 (삭제 대신 구독 취소)
    try {
      await this.mailProvider.unsubscribe(subscriber.email);
    } catch (error: any) {
      this.logger.error(
        `메일 제공자에서 구독자 제거 실패 (${subscriber.email}): ${error?.message || error}`,
      );
      // 삭제는 DB를 기준으로 진행하되, 로그만 남김
    }

    await this.subscriberRepo.remove(subscriber);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  // 구독자 다중 삭제 (DB 기준, 외부 제공자는 best-effort)
  async deleteMany(ids: (number | string)[]) {
    let deletedCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const numericId = typeof id === 'string' ? Number(id) : id;
        const subscriber = await this.subscriberRepo.findOne({
          where: { id: numericId as number },
        });
        if (!subscriber) {
          errors.push(`ID ${id}: 구독자를 찾을 수 없습니다.`);
          continue;
        }

        try {
          await this.mailProvider.unsubscribe(subscriber.email);
        } catch (error: any) {
          this.logger.error(
            `메일 제공자에서 구독자 제거 실패 (${subscriber.email}): ${error?.message || error}`,
          );
        }

        await this.subscriberRepo.remove(subscriber);
        deletedCount += 1;
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

  // GET /newsletter/me - 회원의 뉴스레터 구독 정보 조회 (Easy Mail에서 확인)
  async getMemberSubscription(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    
    // DB(Member + NewsletterSubscriber)를 기준으로 상태 조회
    const subscriber = await this.subscriberRepo.findOne({ where: { email: member.email } });
    const isSubscribed = subscriber?.isSubscribed ?? member.newsletterSubscribed;

    return {
      email: member.email,
      isSubscribed,
      subscriptionLabel: isSubscribed ? 'Y' : 'N',
    };
  }

  // POST /newsletter/me/unsubscribe - 회원의 뉴스레터 구독 취소 (Easy Mail API 사용)
  async unsubscribeMember(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    
    try {
      await this.mailProvider.unsubscribe(member.email);
    } catch (error: any) {
      this.logger.error(
        `메일 제공자에서 회원 구독 취소 실패 (${member.email}): ${error?.message || error}`,
      );
    }

    // NewsletterSubscriber 엔티티 업데이트
    const subscriber = await this.subscriberRepo.findOne({ where: { email: member.email } });
    if (subscriber) {
      subscriber.isSubscribed = false;
      subscriber.unsubscribedAt = new Date();
      subscriber.isMailSynced = true;
      await this.subscriberRepo.save(subscriber);
    }

    // Member 엔티티도 업데이트 (DB 기준)
    member.newsletterSubscribed = false;
    await this.memberRepo.save(member);
    
    return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
  }

  // POST /admin/newsletter/send - 뉴스레터 발송 (배치, 대상: ALL/MEMBERS/SUBSCRIBERS)
  async sendNewsletter(options: SendNewsletterOptions) {
    const { subject, html, target } = options;

    // 1) 대상 이메일 수집 (DB 기준)
    const emailSet = new Set<string>();

    if (target === 'ALL' || target === 'MEMBERS') {
      const members = await this.memberRepo.find({
        where: { newsletterSubscribed: true },
      });
      for (const member of members) {
        if (member.email) {
          emailSet.add(member.email);
        }
      }
    }

    if (target === 'ALL' || target === 'SUBSCRIBERS') {
      const subscribers = await this.subscriberRepo.find({
        where: { isSubscribed: true },
      });
      for (const subscriber of subscribers) {
        if (subscriber.email) {
          emailSet.add(subscriber.email);
        }
      }
    }

    const emails = Array.from(emailSet);
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (email) => {
          try {
            await this.mailProvider.sendNewsletter({ email, subject, html });
            successCount += 1;
          } catch (error: any) {
            failCount += 1;
            this.logger.error(
              `뉴스레터 발송 실패 (${email}): ${error?.message || error}`,
              error?.stack,
            );
          }
        }),
      );
    }

    return {
      success: true,
      total: emails.length,
      sent: successCount,
      failed: failCount,
    };
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

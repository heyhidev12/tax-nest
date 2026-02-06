import { Injectable, ConflictException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  // POST /newsletter/subscribe - 뉴스레터 구독 (이름 + 이메일)
  async subscribe(name: string | undefined, email: string) {
    const existing = await this.subscriberRepo.findOne({ where: { email } });

    // Log before state
    const beforeIsSubscribed = existing?.isSubscribed ?? null;
    this.logger.log(`[SUBSCRIBE] email=${email}, existingId=${existing?.id ?? 'null'}, beforeIsSubscribed=${beforeIsSubscribed}`);

    // Only throw 409 if subscriber exists AND is already subscribed
    if (existing && existing.isSubscribed === true) {
      throw new ConflictException('이미 구독 중인 이메일입니다.');
    }

    if (existing) {
      // Re-subscribe: update existing row
      existing.name = name ?? existing.name;
      existing.isSubscribed = true;
      existing.subscribedAt = new Date(); // Set subscribedAt when re-subscribing
      existing.unsubscribedAt = null;
      existing.isMailSynced = true;
      await this.subscriberRepo.save(existing);
      this.logger.log(`[SUBSCRIBE] Re-subscribed: email=${email}, id=${existing.id}, afterIsSubscribed=true`);
    } else {
      // Create new subscriber
      const subscriber = this.subscriberRepo.create({
        email,
        name,
        isSubscribed: true,
        subscribedAt: new Date(), // Set subscribedAt for new subscribers
        isMailSynced: true,
        unsubscribedAt: null,
      });
      const saved = await this.subscriberRepo.save(subscriber);
      this.logger.log(`[SUBSCRIBE] New subscriber: email=${email}, id=${saved.id}, isSubscribed=true`);
    }

    // Sync Member table if member exists
    const member = await this.memberRepo.findOne({ where: { email } });
    if (member) {
      member.newsletterSubscribed = true;
      await this.memberRepo.save(member);
    }

    return { success: true, message: '뉴스레터 구독이 완료되었습니다.' };
  }

  // 구독 취소 - DB에서만 처리
  async unsubscribe(email: string) {
    const existing = await this.subscriberRepo.findOne({ where: { email } });
    
    // Log before state
    const beforeIsSubscribed = existing?.isSubscribed ?? null;
    this.logger.log(`[UNSUBSCRIBE] email=${email}, existingId=${existing?.id ?? 'null'}, beforeIsSubscribed=${beforeIsSubscribed}`);

    if (existing) {
      // Already unsubscribed - return success (idempotent)
      if (existing.isSubscribed === false) {
        this.logger.log(`[UNSUBSCRIBE] Already unsubscribed: email=${email}, id=${existing.id}`);
        return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
      }

      existing.isSubscribed = false;
      existing.unsubscribedAt = new Date();
      existing.isMailSynced = true;
      await this.subscriberRepo.save(existing);
      this.logger.log(`[UNSUBSCRIBE] Unsubscribed: email=${email}, id=${existing.id}, afterIsSubscribed=false`);
    } else {
      // No subscriber row exists - still return success (idempotent)
      this.logger.log(`[UNSUBSCRIBE] No subscriber row found: email=${email}`);
    }

    // Sync Member table if member exists
    const member = await this.memberRepo.findOne({ where: { email } });
    if (member) {
      member.newsletterSubscribed = false;
      await this.memberRepo.save(member);
    }

    return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
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

    // Batch load members to check for mismatches
    const emails = items.map(s => s.email).filter(Boolean);
    const members = emails.length > 0 
      ? await this.memberRepo.find({ where: { email: In(emails) } })
      : [];
    const memberMap = new Map(members.map(m => [m.email, m]));

    const formattedItems = items.map((subscriber, index) => {
      const subscribedAt = subscriber.subscribedAt || new Date();
      const unsubscribedAt = subscriber.unsubscribedAt || null;
      
      // Single source of truth: prefer member.newsletterSubscribed if member exists
      const member = subscriber.email ? memberMap.get(subscriber.email) : null;
      const finalIsSubscribed = member 
        ? member.newsletterSubscribed 
        : subscriber.isSubscribed;
      
      return {
        id: subscriber.id,
        name: subscriber.name || '-',
        email: subscriber.email,
        isSubscribed: finalIsSubscribed,
        subscribedAt,
        unsubscribedAt,
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
      subscribedAt,
      unsubscribedAt,
      isMailSynced: subscriber.isMailSynced,
    };
  }

  // 구독 상태 토글 (DB 처리)
  async toggleSubscription(id: number | string) {
    const numericId = typeof id === 'string' ? Number(id) : id;
    
    // Use transaction to ensure both updates succeed or fail together
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      const subscriber = await transactionalEntityManager.findOne(NewsletterSubscriber, {
        where: { id: numericId as number },
      });
      if (!subscriber) {
        throw new NotFoundException('구독자를 찾을 수 없습니다.');
      }

      // Step 1: Toggle newsletter table
      const newSubscribedStatus = !subscriber.isSubscribed;
      subscriber.isSubscribed = newSubscribedStatus;
      subscriber.unsubscribedAt = newSubscribedStatus ? null : new Date();
      subscriber.isMailSynced = true;
      await transactionalEntityManager.save(NewsletterSubscriber, subscriber);

      // Step 2: Sync related member (find by email or memberId)
      // Priority: memberId (if exists) > email (fallback)
      let member: Member | null = null;
      
      // Try to find by email first (most common case)
      if (subscriber.email) {
        member = await transactionalEntityManager.findOne(Member, {
          where: { email: subscriber.email },
        });
      }

      if (member) {
        member.newsletterSubscribed = newSubscribedStatus;
        await transactionalEntityManager.save(Member, member);
      }

      return {
        success: true,
        isSubscribed: subscriber.isSubscribed,
        newsletterSubscribed: newSubscribedStatus, // Return for frontend consistency
      };
    });
  }

  // 구독자 삭제 (DB 삭제)
  async delete(id: number | string) {
    const numericId = typeof id === 'string' ? Number(id) : id;
    const subscriber = await this.subscriberRepo.findOne({
      where: { id: numericId as number },
    });
    if (!subscriber) {
      throw new NotFoundException('구독자를 찾을 수 없습니다.');
    }

    await this.subscriberRepo.remove(subscriber);
    return { success: true, message: '삭제가 완료되었습니다.' };
  }

  // 구독자 다중 삭제 (DB 삭제)
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

  // GET /newsletter/me - 회원의 뉴스레터 구독 정보 조회
  async getMemberSubscription(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // Single source of truth: NewsletterSubscriber table (same table that subscribe/unsubscribe updates)
    const subscriber = await this.subscriberRepo.findOne({ where: { email: member.email } });
    
    // If subscriber row exists, use its isSubscribed value; otherwise default to member.newsletterSubscribed
    const isSubscribed = subscriber ? subscriber.isSubscribed : (member.newsletterSubscribed ?? false);

    return {
      email: member.email,
      isSubscribed,
    };
  }

  // POST /newsletter/me/unsubscribe - 회원의 뉴스레터 구독 취소 (DB 처리)
  async unsubscribeMember(memberId: number) {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // Find or create subscriber row
    let subscriber = await this.subscriberRepo.findOne({ where: { email: member.email } });
    
    // Log before state
    const beforeIsSubscribed = subscriber?.isSubscribed ?? null;
    this.logger.log(`[UNSUBSCRIBE_MEMBER] memberId=${memberId}, email=${member.email}, subscriberId=${subscriber?.id ?? 'null'}, beforeIsSubscribed=${beforeIsSubscribed}`);

    if (subscriber) {
      // Already unsubscribed - return success (idempotent)
      if (subscriber.isSubscribed === false) {
        this.logger.log(`[UNSUBSCRIBE_MEMBER] Already unsubscribed: email=${member.email}, id=${subscriber.id}`);
        return { success: true, message: '뉴스레터 구독이 취소되었습니다.' };
      }

      // Update NewsletterSubscriber table (single source of truth)
      subscriber.isSubscribed = false;
      subscriber.unsubscribedAt = new Date();
      subscriber.isMailSynced = true;
      await this.subscriberRepo.save(subscriber);
      this.logger.log(`[UNSUBSCRIBE_MEMBER] Unsubscribed: email=${member.email}, id=${subscriber.id}, afterIsSubscribed=false`);
    } else {
      // No subscriber row exists - create one with isSubscribed=false
      subscriber = this.subscriberRepo.create({
        email: member.email,
        name: member.name,
        isSubscribed: false,
        unsubscribedAt: new Date(),
        isMailSynced: true,
      });
      const saved = await this.subscriberRepo.save(subscriber);
      this.logger.log(`[UNSUBSCRIBE_MEMBER] Created unsubscribed row: email=${member.email}, id=${saved.id}, isSubscribed=false`);
    }

    // Sync Member table
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

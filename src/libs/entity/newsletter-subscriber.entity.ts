import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn()
  id: number;

  // 구독자 이름
  @Column({ nullable: true })
  name: string;

  // 구독자 이메일
  @Column({ unique: true })
  email: string;

  // 수신 여부 (Y/N)
  @Column({ default: true })
  isSubscribed: boolean;

  @CreateDateColumn()
  subscribedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unsubscribedAt: Date | null;
}

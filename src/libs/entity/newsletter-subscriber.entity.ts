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

  @Column({ unique: true })
  email: string;

  // 수신 여부
  @Column({ default: true })
  isSubscribed: boolean;

  @CreateDateColumn()
  subscribedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unsubscribedAt: Date | null;
}


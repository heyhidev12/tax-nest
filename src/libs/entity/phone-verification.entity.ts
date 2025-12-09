import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('phone_verifications')
export class PhoneVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  phoneNumber: string;

  @Column()
  code: string;

  // find-id, reset-password va h.k. uchun
  @Column({ default: 'GENERAL' })
  purpose: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

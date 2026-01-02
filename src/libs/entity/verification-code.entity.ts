import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['PHONE', 'EMAIL'] })
  type: 'PHONE' | 'EMAIL';

  @Index()
  @Column()
  target: string; // phone number or email

  @Column({ type: 'enum', enum: ['FIND_ID', 'RESET_PASSWORD', 'SIGNUP', 'CHANGE_PHONE'] })
  purpose: 'FIND_ID' | 'RESET_PASSWORD' | 'SIGNUP' | 'CHANGE_PHONE';

  @Column()
  code: string;

  @Column()
  isUsed: boolean = false;

  @Column({ default: 0 })
  attempts: number;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

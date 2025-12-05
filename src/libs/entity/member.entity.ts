import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MemberType } from '../enums/members.enum';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  // 로그인 ID (이메일 기반)
  @Column({ unique: true })
  loginId: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'enum', enum: MemberType })
  memberType: MemberType;

  // 보험사 회원 승인 상태 (일반/법인은 자동 승인, 보험사는 승인대기) :contentReference[oaicite:3]{index=3}
  @Column({ default: true })
  isApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

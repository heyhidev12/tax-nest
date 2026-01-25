import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MemberType,MemberStatus } from '../enums/members.enum';

@Entity('members')
@Index(['provider', 'providerId'], { unique: true })
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  // 로그인 ID (이메일 기반)
  @Column({ unique: true })
  loginId: string;

  @Column({ nullable: true })
  passwordHash: string; // Nullable for SNS login users

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: MemberType })
  memberType: MemberType;

  // 보험사 회원 승인 상태 (일반/법인은 자동 승인, 보험사는 승인대기)
  @Column({ default: true })
  isApproved: boolean;

  // 회원 상태 (이용중/탈퇴)
  @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
  status: MemberStatus;

  // 뉴스레터 구독 여부
  @Column({ default: false })
  newsletterSubscribed: boolean;

  // 소속 (보험사 이름 등)
  @Column({ nullable: true })
  affiliation: string;

  // SNS 로그인 관련
  @Column({ nullable: true })
  provider: string; // 'google', 'kakao', 'naver'

  @Column({ nullable: true })
  providerId: string; // SNS 제공자의 사용자 ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

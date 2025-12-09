import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ConsultationStatus } from '../enums/consultations.enum';
import { MemberFlag } from '../enums/members.enum';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string; // 이전 데이터 호환성을 위해 nullable 유지

  @Column({ nullable: true })
  passwordHash: string; // 이전 데이터 호환성을 위해 nullable 유지

  @Column()
  phoneNumber: string;

  @Column()
  consultingField: string; // 상담 분야

  @Column({ nullable: true })
  assignedTaxAccountant: string; // 담당 세무사

  @Column({ nullable: true })
  insuranceCompanyName: string; // 이전 데이터 호환성을 위해 nullable 유지

  @Column({ nullable: true })
  residenceArea: string; // 이전 데이터 호환성을 위해 nullable 유지

  @Column({ type: 'text' })
  content: string; // 상담 내용

  // 개인정보 처리 방침 이용 동의
  @Column({ default: false })
  privacyAgreed: boolean;

  // 이용 동의
  @Column({ default: false })
  termsAgreed: boolean;

  // 회원/비회원 구분
  @Column({ type: 'enum', enum: MemberFlag, default: MemberFlag.NON_MEMBER })
  memberFlag: MemberFlag;

  // 진행 상태 (기본: 신청완료, 관리자에서 완료로 변경)
  @Column({ type: 'enum', enum: ConsultationStatus, default: ConsultationStatus.PENDING })
  status: ConsultationStatus;

  // 관리자 답변
  @Column({ type: 'text', nullable: true })
  answer: string;

  @CreateDateColumn()
  createdAt: Date;
}

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

  @Column()
  email: string;

  // 사용자 입력 비밀번호 (4~8 자리 숫자) -> 해시로 저장
  @Column()
  passwordHash: string;

  @Column()
  phoneNumber: string;

  @Column()
  consultingField: string; // ex) 세무조정, 세무조사, 상속세 등

  @Column({ nullable: true })
  insuranceCompanyName: string;

  @Column()
  residenceArea: string;

  @Column({ type: 'text' })
  content: string;

  // 개인정보 동의 여부
  @Column({ default: false })
  privacyAgreed: boolean;

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

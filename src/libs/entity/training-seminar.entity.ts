import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MemberType } from '../enums/members.enum';

export enum TrainingSeminarType {
  VOD = 'VOD',
  SEMINAR = 'SEMINAR',
  TRAINING = 'TRAINING',
  LECTURE = 'LECTURE',
}

export enum RecruitmentType {
  FIRST_COME = 'FIRST_COME',       // 선착순
  SELECTION = 'SELECTION',         // 선발
}

export enum ApplicationStatus {
  WAITING = 'WAITING',     // 대기중
  CONFIRMED = 'CONFIRMED', // 확정
  CANCELLED = 'CANCELLED', // 취소
}

export enum TargetMemberType {
  ALL = 'ALL',           // 전체
  GENERAL = 'GENERAL',   // 일반회원
  INSURANCE = 'INSURANCE', // 보험사
  OTHER = 'OTHER',       // 기타
}

@Entity('training_seminars')
export class TrainingSeminar {
  @PrimaryGeneratedColumn()
  id: number;

  // 교육/세미나 이름
  @Column()
  name: string;

  // 교육/세미나 유형 (VOD, SEMINAR, TRAINING, LECTURE)
  @Column({ type: 'enum', enum: TrainingSeminarType })
  type: TrainingSeminarType;

  // 모집 유형 (선착순, 선발)
  @Column({ type: 'enum', enum: RecruitmentType })
  recruitmentType: RecruitmentType;

  // 모집 마감일 (YY.MM.DD)
  @Column({ type: 'date' })
  recruitmentEndDate: Date;

  // 대상 회원 유형 (전체, 일반, 보험사, 기타)
  @Column({ type: 'enum', enum: TargetMemberType, default: TargetMemberType.ALL })
  targetMemberType: TargetMemberType;

  // 이미지 URL
  @Column({ nullable: true })
  // 이미지 - {id, url} object
  @Column({ type: 'json' })
  image: { id: number; url: string };

  // 강사명
  @Column({ nullable: true })
  instructorName: string;

  // 대상 (텍스트)
  @Column({ nullable: true })
  target: string;

  // 본문 (HTML)
  @Column({ type: 'longtext' })
  body: string;

  // 교육 일자 (다중 선택 가능) - JSON 배열로 저장: ["2025.12.20", "2025.12.22", "2025.12.25", "2025.12.26"]
  @Column({ type: 'json', nullable: true })
  educationDates: string[];

  // 교육 시간 슬롯 (다중 선택 가능) - JSON 배열로 저장: ["11:00-12:00", "14:00-15:00", "17:00-18:00"]
  @Column({ type: 'json', nullable: true })
  educationTimeSlots: string[];

  // 교육 장소
  @Column({ nullable: true })
  location: string;

  // 기타 입력란
  @Column({ type: 'text', nullable: true })
  otherInfo: string;

  // 모집 정원 (선착순일 경우 필수)
  @Column({ nullable: true })
  quota: number;

  // 가격
  @Column({ type: 'int', default: 0 })
  price: number;

  // 노출 여부
  @Column({ default: true })
  isExposed: boolean;

  // 추천 세미나 여부
  @Column({ default: false })
  isRecommended: boolean;

  // Vimeo 비디오 URL (관리자용, 승인된 신청자에게만 노출)
  @Column({ nullable: true })
  vimeoVideoUrl: string;

  @OneToMany(() => TrainingSeminarApplication, (app) => app.trainingSeminar)
  applications: TrainingSeminarApplication[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('training_seminar_applications')
export class TrainingSeminarApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trainingSeminarId: number;

  @ManyToOne(() => TrainingSeminar, (ts) => ts.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingSeminarId' })
  trainingSeminar: TrainingSeminar;

  // 신청자 정보
  @Column()
  name: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  // 참여 희망 일자 (yyyy.MM.dd or yyyy-MM-dd)
  @Column({ type: 'date' })
  participationDate: string | Date;

  // 참여 희망 시간 (HH:mm)
  @Column({ nullable: true })
  participationTime: string;

  // 참석 인원
  @Column({ default: 1 })
  attendeeCount: number;

  // 요청사항 (선택)
  @Column({ type: 'text', nullable: true })
  requestDetails: string;

  // 신청 상태 (대기중, 확정, 취소)
  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.WAITING })
  status: ApplicationStatus;

  @CreateDateColumn()
  appliedAt: Date;
}

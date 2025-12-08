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
  FIRST_SERVED = 'FIRST_SERVED',   // 선착순 마감
  SELECTION = 'SELECTION',         // 선발
}

export enum ApplicationStatus {
  WAITING = 'WAITING',     // 대기중
  CONFIRMED = 'CONFIRMED', // 확정
  CANCELLED = 'CANCELLED', // 취소
}

@Entity('training_seminars')
export class TrainingSeminar {
  @PrimaryGeneratedColumn()
  id: number;

  // 모집 날짜 (YY.MM.DD)
  @Column({ type: 'date' })
  recruitmentDate: Date;

  // 모집 유형
  @Column({ type: 'enum', enum: RecruitmentType })
  recruitmentType: RecruitmentType;

  // 교육/세미나 유형
  @Column({ type: 'enum', enum: TrainingSeminarType })
  type: TrainingSeminarType;

  // 교육/세미나 이름
  @Column()
  name: string;

  // 이미지 URL
  @Column({ nullable: true })
  imageUrl: string;

  // 대상 회원 유형
  @Column({ type: 'enum', enum: MemberType, nullable: true })
  targetMemberType: MemberType;

  // 본문 (HTML)
  @Column({ type: 'longtext' })
  body: string;

  // 교육 기간 (시작일~종료일)
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // 참여 시간
  @Column({ nullable: true })
  participationTime: string;

  // 교육 장소
  @Column({ nullable: true })
  location: string;

  // 강사명
  @Column({ nullable: true })
  instructorName: string;

  // 모집 정원
  @Column({ nullable: true })
  quota: number;

  @Column({ default: true })
  isExposed: boolean;

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

  // 참여 희망 일시
  @Column({ type: 'date' })
  participationDate: Date;

  @Column({ nullable: true })
  participationTime: string;

  // 신청 상태
  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.WAITING })
  status: ApplicationStatus;

  @CreateDateColumn()
  appliedAt: Date;
}



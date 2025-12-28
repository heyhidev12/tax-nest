import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 세무사 회원 (공개 프로필) - Module 06
@Entity('tax_members')
export class TaxMember {
  @PrimaryGeneratedColumn()
  id: number;

  // 회원명 (필수)
  @Column()
  name: string;

  // 메인 사진 (필수) - {id, url} object
  @Column({ type: 'json' })
  mainPhoto: { id: number; url: string };

  // 서브 사진 (필수) - {id, url} object
  @Column({ type: 'json' })
  subPhoto: { id: number; url: string };

  // 업무분야 (3개까지 - 1순위/2순위/3순위)
  @Column({ type: 'json' })
  workAreas: string[];

  // 소속명 (선택)
  @Column({ nullable: true })
  affiliation: string;

  // 휴대전화번호 (선택)
  @Column({ nullable: true })
  phoneNumber: string;

  // 이메일 (선택)
  @Column({ nullable: true })
  email: string;

  // V-Card 파일 (선택) - {id, url} object
  @Column({ type: 'json', nullable: true })
  vcard: { id: number; url: string } | null;

  // PDF 파일 (선택) - {id, url} object
  @Column({ type: 'json', nullable: true })
  pdf: { id: number; url: string } | null;

  // 한 줄 소개 (필수)
  @Column()
  oneLineIntro: string;

  // 전문가 소개 (필수)
  @Column({ type: 'text' })
  expertIntro: string;

  // 주요 처리사례 (선택)
  @Column({ type: 'text', nullable: true })
  mainCases: string;

  // 학력 (선택)
  @Column({ type: 'text', nullable: true })
  education: string;

  // 경력 및 수상 (선택)
  @Column({ type: 'text', nullable: true })
  careerAndAwards: string;

  // 저서/활동/기타 (선택)
  @Column({ type: 'text', nullable: true })
  booksActivitiesOther: string;

  // 노출 여부
  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



















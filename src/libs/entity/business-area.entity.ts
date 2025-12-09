import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BusinessAreaContentType {
  A = 'A',  // A타입
  B = 'B',  // B타입 (컨설팅)
  C = 'C',  // C타입 (커스텀)
}

@Entity('business_areas')
export class BusinessArea {
  @PrimaryGeneratedColumn()
  id: number;

  // 콘텐츠 타입 (필수) - A~C
  @Column({ type: 'enum', enum: BusinessAreaContentType })
  contentType: BusinessAreaContentType;

  // 업무분야명 (필수)
  @Column()
  name: string;

  // 부제목 (선택)
  @Column({ nullable: true })
  subDescription: string;

  // 대표 이미지 URL (필수)
  @Column()
  imageUrl: string;

  // 업무분야 (대분류/중분류 - Dropdown)
  @Column()
  majorCategory: string;

  @Column({ nullable: true })
  minorCategory: string;

  // 개요 (필수)
  @Column({ type: 'text' })
  overview: string;

  // 본문 - HTML (필수)
  @Column({ type: 'longtext' })
  body: string;

  // YouTube URL (선택) - 여러 개 가능 (JSON 배열 또는 콤마 구분 문자열)
  @Column({ type: 'text', nullable: true })
  youtubeUrl: string; // JSON 배열 문자열 또는 콤마 구분 문자열로 저장 가능

  // 메인 노출 여부
  @Column({ default: false })
  isMainExposed: boolean;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}





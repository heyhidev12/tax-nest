import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  // 본사/지점 이름
  @Column()
  name: string;

  // 상세 주소
  @Column()
  address: string;

  // 위도 (Naver Maps Geocode API로 자동 설정)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  // 경도 (Naver Maps Geocode API로 자동 설정)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  fax: string;

  @Column({ nullable: true })
  email: string;

  // 블로그 URL (선택)
  @Column({ nullable: true })
  blogUrl: string;

  // YouTube URL (선택)
  @Column({ nullable: true })
  youtubeUrl: string;

  // Instagram URL (선택)
  @Column({ nullable: true })
  instagramUrl: string;

  // Website URL (선택)
  @Column({ nullable: true })
  websiteUrl: string;

  // 버스 이용 방법 (선택)
  @Column({ type: 'text', nullable: true })
  busInfo: string;

  // 지하철 이용 방법 (선택)
  @Column({ type: 'text', nullable: true })
  subwayInfo: string;

  // 택시 이용 방법 (선택)
  @Column({ type: 'text', nullable: true })
  taxiInfo: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isExposed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


















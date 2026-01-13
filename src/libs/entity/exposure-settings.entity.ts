import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

// 노출 관리 설정 - Module 05
@Entity('exposure_settings')
export class ExposureSettings {
  @PrimaryGeneratedColumn()
  id: number;

  // 설정 키
  @Column({ unique: true })
  key: string;

  // 설정 값 (JSON)
  @Column({ type: 'json' })
  value: Record<string, any>;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 기본 설정 키:
// - awards_main: { exposed: boolean } - AWARDS 섹션 메인 노출 여부
// - newsletter_page: { exposed: boolean } - Newsletter 페이지 노출 여부
// - history_page: { exposed: boolean } - History 페이지 노출 여부
























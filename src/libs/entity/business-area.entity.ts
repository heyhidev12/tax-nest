import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InsightsSubcategory } from './insights-subcategory.entity';
import { BusinessAreaCategory } from './business-area-category.entity';

@Entity('business_areas')
export class BusinessArea {
  @PrimaryGeneratedColumn()
  id: number;

  // 업무분야명 (필수)
  @Column()
  name: string;

  // 부제목 (선택)
  @Column({ nullable: true })
  subDescription: string;

  // 대표 이미지 URL (필수)
  @Column()
  imageUrl: string;

  /**
   * Major Category ID - References InsightsSubcategory (업종별, 컨설팅, etc.)
   * This comes from /admin/insights/subcategories
   */
  @Column()
  majorCategoryId: number;

  @ManyToOne(() => InsightsSubcategory, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'majorCategoryId', referencedColumnName: 'id' })
  majorCategory: InsightsSubcategory;

  /**
   * Minor Category ID - References BusinessAreaCategory
   * This is a Business Areas-only category created by admin
   */
  @Column()
  minorCategoryId: number;

  @ManyToOne(() => BusinessAreaCategory, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'minorCategoryId', referencedColumnName: 'id' })
  minorCategory: BusinessAreaCategory;

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

// Keep enum for backward compatibility (may be removed later if not needed)
export enum BusinessAreaContentType {
  A = 'A',
  B = 'B',
  C = 'C',
}





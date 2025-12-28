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

  // 대표 이미지 (필수) - {id, url} object
  @Column({ type: 'json' })
  image: { id: number; url: string };

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

  // 본문 - HTML (deprecated, kept for backward compatibility)
  @Column({ type: 'longtext', nullable: true })
  body: string;

  /**
   * Section-based content - JSON array of section content objects
   * Each object has: { section: string, content: string }
   * Example: [{ section: "발생원인", content: "<p>HTML content</p>" }, ...]
   */
  @Column({ type: 'json', nullable: true })
  sectionContents: Array<{ section: string; content: string }>;

  // YouTube URLs (선택) - 여러 개 가능
  @Column({ type: 'json', nullable: true })
  youtubeUrls: string[];

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





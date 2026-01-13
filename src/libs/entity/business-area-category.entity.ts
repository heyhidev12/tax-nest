import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { InsightsSubcategory } from './insights-subcategory.entity';
import { BusinessArea } from './business-area.entity';

/**
 * Business Area Category Entity (Minor Category)
 * Categories belong to a major category (from Insights Subcategories)
 * and group Business Area items
 */
@Entity('business_area_categories')
export class BusinessAreaCategory {
  @PrimaryGeneratedColumn()
  id: number;

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
   * Category name (e.g., 제조업, IT서비스업, 건설업, etc.)
   */
  @Column({ length: 100 })
  name: string;

  // 대표 이미지 (필수) - {id, url} object
  @Column({ type: 'json', nullable: true })
  image: { id: number; url: string };

  @Column({ default: true })
  isExposed: boolean;

  // 메인 노출 여부
  @Column({ default: false })
  isMainExposed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BusinessArea, (item) => item.minorCategory)
  items: BusinessArea[];
}


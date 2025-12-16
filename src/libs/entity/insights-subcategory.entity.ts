import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InsightsItem } from './insights-item.entity';

/**
 * Global Insights Subcategory Entity
 * Subcategories are global and not linked to categories
 * Categories and subcategories are related only at the item level
 */
@Entity('insights_subcategories')
export class InsightsSubcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  /**
   * Sections configuration - array of selected section values
   * Valid values: 발생원인, 리스크, 체크포인트, 함께 실행방안, 케이스
   */
  @Column({ type: 'json' })
  sections: string[];

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @OneToMany(() => InsightsItem, (item) => item.subcategory)
  items: InsightsItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



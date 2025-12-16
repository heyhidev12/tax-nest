import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InsightsCategory } from './insights-category.entity';
import { InsightsSubcategory } from './insights-subcategory.entity';

@Entity('insights_items')
export class InsightsItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => InsightsCategory, (category) => category.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId', referencedColumnName: 'id' })
  category: InsightsCategory;

  @Column()
  subcategoryId: number;

  @ManyToOne(() => InsightsSubcategory, (subcategory) => subcategory.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'subcategoryId', referencedColumnName: 'id' })
  subcategory: InsightsSubcategory;

  @Column({ default: false })
  enableComments: boolean;

  @Column({ length: 10, default: 'N' })
  commentsLabel: string;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ length: 10, default: 'Y' })
  exposedLabel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



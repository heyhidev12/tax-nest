import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InsightsSubcategory } from './insights-subcategory.entity';
import { InsightsItem } from './insights-item.entity';
import { TargetMemberType } from './training-seminar.entity';

export enum CategoryType {
  A = 'A',
  B = 'B',
  C = 'C',
}

@Entity('insights_categories')
export class InsightsCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ type: 'enum', enum: TargetMemberType, default: TargetMemberType.ALL })
  targetMemberType: TargetMemberType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InsightsItem, (item) => item.category)
  items: InsightsItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



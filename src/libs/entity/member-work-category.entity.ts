import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TaxMember } from './tax-member.entity';
import { BusinessAreaCategory } from './business-area-category.entity';

/**
 * Member Work Category Mapping Entity
 * Many-to-many relationship between TaxMember and BusinessAreaCategory
 * with category-specific display order
 */
@Entity('member_work_categories')
@Unique(['memberId', 'categoryId'])
export class MemberWorkCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @ManyToOne(() => TaxMember, (member) => member.memberWorkCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: TaxMember;

  @Column()
  categoryId: number;

  @ManyToOne(() => BusinessAreaCategory, (category) => category.memberWorkCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: BusinessAreaCategory;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

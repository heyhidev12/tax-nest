import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// 대분류 카테고리
@Entity('major_categories')
export class MajorCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @OneToMany(() => MinorCategory, (minor) => minor.majorCategory)
  minorCategories: MinorCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 중분류 카테고리
@Entity('minor_categories')
export class MinorCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  majorCategoryId: number;

  @ManyToOne(() => MajorCategory, (major) => major.minorCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'majorCategoryId' })
  majorCategory: MajorCategory;

  @Column()
  name: string;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



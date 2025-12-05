import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('award_years')
export class AwardYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('awards')
export class Award {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  awardYearId: number;

  @ManyToOne(() => AwardYear, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'awardYearId' })
  awardYear: AwardYear;

  // 수상/인증 명칭 (필수)
  @Column()
  name: string;

  // 출처 (필수)
  @Column()
  source: string;

  // 이미지 URL (필수)
  @Column()
  imageUrl: string;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


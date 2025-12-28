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

@Entity('award_years')
export class AwardYear {
  @PrimaryGeneratedColumn()
  id: number;

  // 년도 명 (필수)
  @Column()
  yearName: string;

  // 메인 노출 여부 (Y/N)
  @Column({ default: false })
  isMainExposed: boolean;

  // 노출 여부 (Y/N)
  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @OneToMany(() => Award, (award) => award.awardYear, { cascade: true })
  awards: Award[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('awards')
export class Award {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  awardYearId: number;

  @ManyToOne(() => AwardYear, (year) => year.awards, { onDelete: 'CASCADE' })
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
  // 이미지 - {id, url} object
  @Column({ type: 'json' })
  image: { id: number; url: string };

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

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

@Entity('history_years')
export class HistoryYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  year: number;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @OneToMany(() => HistoryItem, (item) => item.historyYear, { cascade: true })
  items: HistoryItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('history_items')
export class HistoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  historyYearId: number;

  @ManyToOne(() => HistoryYear, (year) => year.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'historyYearId' })
  historyYear: HistoryYear;

  // 월 (선택)
  @Column({ nullable: true })
  month: number;

  // 내용 (필수)
  @Column({ type: 'text' })
  content: string;

  // 노출 여부
  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

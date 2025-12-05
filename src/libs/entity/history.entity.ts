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

  @Column({ nullable: true })
  month: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}


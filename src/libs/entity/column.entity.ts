import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('columns')
export class ColumnArticle {
  @PrimaryGeneratedColumn()
  id: number;

  // 칼럼명
  @Column()
  name: string;

  // 카테고리명
  @Column()
  categoryName: string;

  // 썸네일 이미지 URL
  @Column()
  thumbnailUrl: string;

  // 본문 (HTML)
  @Column({ type: 'longtext' })
  body: string;

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


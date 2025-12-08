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

  // 칼럼명 (필수)
  @Column()
  name: string;

  // 카테고리명 (필수) - 대분류 + 중분류
  @Column()
  categoryName: string;

  // 썸네일 이미지 URL (필수)
  @Column()
  thumbnailUrl: string;

  // 본문 (HTML) (필수)
  @Column({ type: 'longtext' })
  body: string;

  // 작성자 이름 (관리자/보험사 직원이 작성 시 표시)
  @Column({ nullable: true })
  authorName: string;

  // 메인 노출 여부
  @Column({ default: false })
  isMainExposed: boolean;

  // 노출 여부
  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

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

  @OneToMany(() => ColumnComment, (comment) => comment.column)
  comments: ColumnComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('column_comments')
export class ColumnComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  columnId: number;

  @ManyToOne(() => ColumnArticle, (column) => column.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: ColumnArticle;

  // 댓글 내용
  @Column({ type: 'text' })
  body: string;

  // 작성자 ID (회원이면)
  @Column({ nullable: true })
  memberId: number;

  // 작성자 이름 (비회원이면)
  @Column({ nullable: true })
  authorName: string;

  // 신고됨 여부
  @Column({ default: false })
  isReported: boolean;

  // 숨김 여부
  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

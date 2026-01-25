import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InsightsCategory } from './insights-category.entity';
import { InsightsSubcategory } from './insights-subcategory.entity';
import { Member } from './member.entity';
import { AdminUser } from './admin-user.entity';

@Entity('insights_items')
export class InsightsItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  // 썸네일 이미지 - {id, url} object
  @Column({ type: 'json', nullable: true })
  thumbnail: { id: number; url: string } | null;

  // 첨부 파일 배열 - [{id, url, type?}] array (supports multiple files: IMAGE, PDF, VIDEO)
  @Column({ type: 'json', nullable: true, default: null })
  files: Array<{ id: number; url: string; type?: string }> | null;

  @Column({ type: 'text' })
  content: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => InsightsCategory, (category) => category.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId', referencedColumnName: 'id' })
  category: InsightsCategory;

  @Column()
  subcategoryId: number;

  @ManyToOne(() => InsightsSubcategory, (subcategory) => subcategory.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'subcategoryId', referencedColumnName: 'id' })
  subcategory: InsightsSubcategory;

  @Column({ nullable: true })
  adminId: number;

  @ManyToOne(() => AdminUser, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin: AdminUser;

  @Column({ default: false })
  enableComments: boolean;

  @Column({ length: 10, default: 'N' })
  commentsLabel: string;

  @Column({ default: true })
  isExposed: boolean;

  @Column({ default: false })
  isMainExposed: boolean;

  @Column({ length: 10, default: 'Y' })
  exposedLabel: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @OneToMany(() => InsightsComment, (comment) => comment.item, { cascade: true })
  comments: InsightsComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('insights_comments')
export class InsightsComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number;

  @ManyToOne(() => InsightsItem, (item) => item.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InsightsItem;

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

  @OneToMany(() => InsightsCommentReport, (report) => report.comment, { cascade: true })
  reports: InsightsCommentReport[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('insights_comment_reports')
@Index(['commentId', 'reporterId'], { unique: true }) // Prevent duplicate reports
export class InsightsCommentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  commentId: number;

  @ManyToOne(() => InsightsComment, (comment) => comment.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: InsightsComment;

  // 신고자 ID (회원 ID, 필수)
  @Column()
  reporterId: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: Member;

  @CreateDateColumn()
  createdAt: Date;
}




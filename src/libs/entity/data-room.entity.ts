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
import { MemberType } from '../enums/members.enum';

export enum DataRoomType {
  ALL = 'ALL',
  GENERAL = 'GENERAL',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

@Entity('data_rooms')
export class DataRoom {
  @PrimaryGeneratedColumn()
  id: number;

  // 자료실 이름
  @Column()
  name: string;

  // 게시판 유형 (갤러리/스니펫/게시판)
  @Column({ nullable: true })
  boardType: string;

  // 노출 유형
  @Column({ type: 'enum', enum: DataRoomType, default: DataRoomType.ALL })
  exposureType: DataRoomType;

  // 댓글 기능 사용 여부
  @Column({ default: false })
  enableComments: boolean;

  @Column({ default: true })
  isExposed: boolean;

  @OneToMany(() => DataRoomContent, (content) => content.dataRoom)
  contents: DataRoomContent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('data_room_contents')
export class DataRoomContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dataRoomId: number;

  @ManyToOne(() => DataRoom, (room) => room.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataRoomId' })
  dataRoom: DataRoom;

  // 콘텐츠 이름
  @Column()
  name: string;

  // 대표 이미지 URL
  @Column({ nullable: true })
  imageUrl: string;

  // 본문 (HTML) - Hidtl 여부에 따라 노출
  @Column({ type: 'longtext', nullable: true })
  body: string;

  // 카테고리명
  @Column({ nullable: true })
  categoryName: string;

  // 작성자
  @Column({ nullable: true })
  authorName: string;

  // 첨부파일 URL
  @Column({ nullable: true })
  attachmentUrl: string;

  // 조회수
  @Column({ default: 0 })
  viewCount: number;

  // 콘텐츠 노출 여부
  @Column({ default: true })
  isExposed: boolean;

  @OneToMany(() => DataRoomComment, (comment) => comment.content)
  comments: DataRoomComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('data_room_comments')
export class DataRoomComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentId: number;

  @ManyToOne(() => DataRoomContent, (content) => content.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: DataRoomContent;

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



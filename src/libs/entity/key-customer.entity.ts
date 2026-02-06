import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('key_customers')
export class KeyCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  // 로고 이미지 (필수) - {id, url} object
  @Column({ type: 'json' })
  logo: { id: number; url: string };

  // 고객사 이름 (선택 - 내부 관리용)
  @Column({ nullable: true })
  name: string;

  // 고객사 웹사이트 URL (선택)
  @Column({ type: 'varchar', length: 255, nullable: true })
  websiteUrl: string | null;

  @Column({ default: 0 })
  displayOrder: number;

  // 메인 노출 여부
  @Column({ default: false })
  isMainExposed: boolean;

  @Column({ default: true })
  isExposed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



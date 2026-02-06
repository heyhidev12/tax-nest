import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FooterPolicyType {
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
}

@Entity('footer_policies')
export class FooterPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: FooterPolicyType, unique: true })
  type: FooterPolicyType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

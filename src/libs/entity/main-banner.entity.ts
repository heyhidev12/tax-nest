import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BannerMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

@Entity('main_banners')
export class MainBanner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: BannerMediaType, default: BannerMediaType.IMAGE })
  mediaType: BannerMediaType;

  // S3/GCS URL
  @Column()
  mediaUrl: string;

  @Column({ nullable: true })
  linkUrl: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


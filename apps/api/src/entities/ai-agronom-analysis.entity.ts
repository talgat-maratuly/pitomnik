import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiPlantStatus } from '../common/enums/ai-plant-status.enum';
import { NurseryObject } from './nursery-object.entity';
import { Section } from './section.entity';
import { User } from './user.entity';

@Entity('ai_agronom_analyses')
export class AiAgronomAnalysis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'created_by_id', nullable: true })
  createdById!: number | null;

  @Column({ name: 'object_id' })
  objectId!: number;

  @Column({ name: 'section_id', nullable: true })
  sectionId!: number | null;

  @Column({ type: 'varchar', nullable: true })
  culture!: string | null;

  @Column({ name: 'photo_url', type: 'text' })
  photoUrl!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: AiPlantStatus;

  @Column({ type: 'int' })
  confidence!: number;

  @Column({ name: 'ai_comment', type: 'text' })
  aiComment!: string;

  @Column({ name: 'recommendations', type: 'text', default: '[]' })
  recommendations!: string;

  @Column({ name: 'agronomist_comment', type: 'text', nullable: true })
  agronomistComment!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @ManyToOne(() => NurseryObject, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'object_id' })
  object!: NurseryObject;

  @ManyToOne(() => Section, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'section_id' })
  section!: Section | null;
}

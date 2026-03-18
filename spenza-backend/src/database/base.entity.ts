import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()', unique: true })
  @Generated('uuid')
  uuid: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz' })
  createdOn: Date;

  @Column({ name: 'created_by', nullable: true, type: 'int' })
  createdBy: number | null;

  @UpdateDateColumn({ name: 'modified_on', type: 'timestamptz' })
  modifiedOn: Date;

  @Column({ name: 'modified_by', nullable: true, type: 'int' })
  modifiedBy: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
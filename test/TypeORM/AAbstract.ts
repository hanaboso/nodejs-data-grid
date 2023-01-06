import { BaseEntity, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export default abstract class AAbstract extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @CreateDateColumn()
  public created?: Date;

  @UpdateDateColumn()
  public updated?: Date;

  @DeleteDateColumn()
  public deleted?: Date;
}

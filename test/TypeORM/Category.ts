import { Column, Entity, OneToMany } from 'typeorm';
import AAbstract from './AAbstract';
import Item from './Item';

@Entity()
export default class Category extends AAbstract {
  @Column()
  public name!: string;

  @Column()
  public description!: string;

  @OneToMany(() => Item, (item) => item.category)
  public items!: Item[];
}

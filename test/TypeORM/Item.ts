import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import AAbstract from './AAbstract';
import Category from './Category';
import Tag from './Tag';

@Entity()
export default class Item extends AAbstract {
  @Column()
  public name!: string;

  @Column()
  public description!: string;

  @ManyToOne(() => Category, (category) => category.items)
  public category!: Category;

  @ManyToMany(() => Tag, (tag) => tag.items, { cascade: true })
  @JoinTable({ name: 'item_tag' })
  public tags!: Tag[];
}

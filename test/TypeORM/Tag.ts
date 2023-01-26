import { Column, Entity, ManyToMany } from 'typeorm';
import AAbstract from './AAbstract';
import Item from './Item';

@Entity()
export default class Tag extends AAbstract {

    @Column()
    public name!: string;

    @Column()
    public description!: string;

    @ManyToMany(() => Item, (item) => item.tags)
    public items!: Item[];

}

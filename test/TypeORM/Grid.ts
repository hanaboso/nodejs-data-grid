import { ObjectType, Repository, SelectQueryBuilder } from 'typeorm';
import ATypeORMGrid, { ICallbackFilter, ICallbackSorter } from '../../lib/ATypeORMGrid';
import Item from './Item';

export default class Grid extends ATypeORMGrid<Item> {

    protected override getEntity(): ObjectType<Item> {
        return Item;
    }

    protected override getQueryBuilder(repository: Repository<Item>): SelectQueryBuilder<Item> {
        return repository
            .createQueryBuilder('i')
            .leftJoinAndSelect('i.category', 'c')
            .leftJoinAndSelect('i.tags', 't');
    }

    protected override getFilters(): Record<string, ICallbackFilter | string> {
        return {
            itemId: 'i.id',
            itemName: 'i.name',
            itemDescription: 'i.description',
            categoryName: 'c.name',
            categoryDescription: 'c.description',
            tagName: 't.name',
            tagDescription: 't.description',
            namesAndDescriptions: (queryBuilder, operator, values) => {
                this.addOrExpression(
                    queryBuilder,
                    'CONCAT(i.name, i.description, c.name, c.description, t.name, t.description)',
                    operator,
                    values,
                );
            },
        };
    }

    protected override getSorters(): Record<string, ICallbackSorter | string> {
        return {
            itemId: 'i.id',
            itemName: 'i.name',
            itemDescription: 'i.description',
            categoryName: 'c.name',
            categoryDescription: 'c.description',
            tagName: 't.name',
            tagDescription: 't.description',
            namesAndDescriptions: (queryBuilder, direction) => {
                queryBuilder
                    .addOrderBy('i.name', direction)
                    .addOrderBy('i.description', direction)
                    .addOrderBy('c.name', direction)
                    .addOrderBy('c.description', direction)
                    .addOrderBy('t.name', direction)
                    .addOrderBy('t.description', direction);
            },
        };
    }

    protected override getSearches(): string[] {
        return [
            'itemName',
            'itemDescription',
            'categoryName',
            'categoryDescription',
            'tagName',
            'tagDescription',
            'namesAndDescriptions',
        ];
    }

}

import { Knex } from 'knex';
import AKnexGrid, { ICallbackFilter, ICallbackSorter } from '../lib/AKnexGrid';
import { IGridRequestDto } from '../lib/GridRequestDto';
import GridItem from './GridItem';

export default class ExampleGrid extends AKnexGrid<GridItem> {

    protected filterableColumns: Record<string, ICallbackFilter | string> | null = {
        id: 'e.id',
        namae: 'e.name',
        losos: 'l.id',
        callback: (queryBuilder, column, operator, values) => queryBuilder.andWhere('e.id', operator, values),
    };

    protected sortableColumns: Record<string, ICallbackSorter | string> | null = {
        id: 'e.id',
        losos: 'l.id',
        callback: (queryBuilder, column, direction) => queryBuilder.orderBy('e.id', direction),
    };

    protected searchableColumns: string[] | null = [
        'id',
        'namae',
    ];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected searchQuery(knex: Knex, dto: IGridRequestDto): unknown {
        return knex
            .from('example as e')
            .leftJoin('losos as l', 'e.lososId', '=', 'l.id')
            .select('e.id as id', 'e.name as name', 'l.name as losos');
    }

    protected toObject(data: Record<string, unknown>): GridItem {
        return GridItem.fromRaw(data);
    }

}

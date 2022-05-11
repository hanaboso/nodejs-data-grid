import AKnexGrid from '../lib/AKnexGrid';
import { Knex } from 'knex';
import GridItem from './GridItem';

export default class ExampleGrid extends AKnexGrid<GridItem> {

    protected filterableColumns: Record<string, string> | null = {
        id: 'e.id',
        namae: 'e.name',
        losos: 'l.id',
    };

    protected sortableColumns: Record<string, string> | null = {
        id: 'e.id',
        losos: 'l.id',
    };

    protected searchableColumns: string[] | null = [
        'id',
        'namae',
    ];

    protected searchQuery(knex: Knex) {
        return knex
            .from('example as e')
            .leftJoin('losos as l', 'e.lososId', '=', 'l.id')
            .select('e.id as id', 'e.name as name', 'l.name as losos');
    }

    protected toObject (data: Record<string, unknown>): GridItem {
        return GridItem.fromRaw(data);
    }

}

import { ClassType } from '@deepkit/core';
import { Query } from '@deepkit/orm';
import AGrid from '../lib/AGrid';
import ExampleEntity from './ExampleEntity';

export default class ExampleGrid extends AGrid<ExampleEntity> {

    protected entity: ClassType = ExampleEntity;

    protected filterableColumns: Record<string, string> | null = {
        id: 'id',
        namae: 'name',
    };

    protected sortableColumns: Record<string, string> | null = {
        id: 'id',
    };

    protected searchableColumns: string[] | null = [
        'id',
        'namae',
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected searchQuery(query: Query<any>): Query<any> {
        return query.select('id', 'name');
    }

}

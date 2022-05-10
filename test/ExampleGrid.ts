import AGrid, { FilterList } from '../lib/AGrid';
import { Query } from '@deepkit/orm';
import { ClassType } from '@deepkit/core';
import ExampleEntity from './ExampleEntity';

export default class ExampleGrid extends AGrid<ExampleEntity> {

    protected entity: ClassType = ExampleEntity;

    protected filterableColumns: Record<string, string> | null = {
        id: 'id',
        namae: 'name',
        losos: 'losos.id',
    };

    protected sortableColumns: Record<string, string> | null = {
        id: 'id',
        losos: 'losos.id',
    };

    protected searchableColumns: string[] | null = [
        'id',
        'namae',
    ];

    protected searchQuery(query: Query<any>, filters: FilterList): Query<any> {
        return query
            .select('id', 'name')
            .filter(filters[''])
            // .orderBy('__losos.id', 'desc')
            .useInnerJoinWith('losos')
            .orderBy('id', 'desc')
            // .sort({'id': 'DESC'})
            .filter(filters['losos'])
            .end()
            // .orderBy('`0`.`id`', 'desc')
        ;
    }

}

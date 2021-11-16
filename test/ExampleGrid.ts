import AGrid from '../lib/AGrid';
import { Query } from '@deepkit/orm';
import { ClassType } from '@deepkit/core';
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
    'namae'
  ];

  protected searchQuery(query: Query<any>): Query<any> {
    return query.select('id', 'name');
  }

}

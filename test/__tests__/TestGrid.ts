import { Database } from '@deepkit/orm';
import { MySQLDatabaseAdapter } from '@deepkit/mysql';
import ExampleEntity from '../ExampleEntity';
import { Direction, IGridRequestDto, Operator } from '../../lib/GridRequestDto';
import ExampleGrid from '../ExampleGrid';
import { SqlQuery } from '@deepkit/sql';

describe('Grid tests', () => {
  let db: Database;
  let dto: IGridRequestDto;
  let grid: ExampleGrid;
  let adapter: MySQLDatabaseAdapter;

  beforeAll(async () => {
    adapter = new MySQLDatabaseAdapter({
      host: process.env.MARIADB_HOST,
      database: 'test',
      password: 'root',
      user: 'root',
    });
    db = new Database(adapter, [ExampleEntity]);
    try {
      await db.raw(new SqlQuery(['TRUNCATE example;'])).execute();
    } catch (e) {
    }
    await db.migrate();

    grid = new ExampleGrid(db);
    for (let i = 1; i <= 5; i++) {
      await db.persist(new ExampleEntity(i.toString()));
    }
  });

  beforeEach(() => {
    dto = {
      paging: {
        page: 1,
        itemsPerPage: 2,
      },
    };
  });

  afterAll(async () => {
    await db.disconnect(true);
  });

  it('Basic fetch', async () => {
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(1);
    expect(data.items[1].name).toEqual('2');
  });

  it('Last page', async () => {
    dto.paging!.page = 3;
    const data = await grid.filter(dto);
    expect(data.paging.total).toEqual(5);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].id).toEqual(5);
    expect(data.items[0].name).toEqual('5');
  });

  it('Find', async () => {
    dto.filter = [[{
      value: ['2'],
      operator: Operator.EQ,
      column: 'id',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(1);
    expect(data.paging.total).toEqual(1);
    expect(data.items[0].id).toEqual(2);
  });

  it('Find alias', async () => {
    dto.filter = [[{
      value: ['3'],
      operator: Operator.EQ,
      column: 'namae',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].name).toEqual('3');
  });

  it('Sort', async () => {
    dto.sorter = [{
      column: 'id',
      direction: Direction.DESC,
    }];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(5);
    expect(data.items[1].id).toEqual(4);
  });

  it('Search', async () => {
    dto.search = '3';
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].id).toEqual(3);
  });

});

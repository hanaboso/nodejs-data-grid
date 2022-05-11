import { MySQLDatabaseAdapter } from '@deepkit/mysql';
import { Database } from '@deepkit/orm';
import kknex, { Knex } from 'knex';
import { Direction, IGridRequestDto, Operator } from '../../lib/GridRequestDto';
import ExampleKnexGrid from '../ExampleKnexGrid';

describe('Grid tests', () => {
  let grid: ExampleKnexGrid;
  let db: Database;
  let dto: IGridRequestDto;
  let adapter: MySQLDatabaseAdapter;
  let knex: Knex;

  beforeAll(async () => {
    adapter = new MySQLDatabaseAdapter({
      host: process.env.MARIADB_HOST,
      database: 'test',
      password: 'root',
      user: 'root',
    });

    grid = new ExampleKnexGrid(knex);

    knex = kknex({
      client: 'mysql',
      connection: {
        host : process.env.MARIADB_HOST,
        port : 3306,
        user : 'root',
        password : 'root',
        database : 'test'
      }
    });

    await knex.raw('SET FOREIGN_KEY_CHECKS = 0;');
    await knex.raw('DROP TABLE IF EXISTS losos;');
    await knex.raw('DROP TABLE IF EXISTS example;');
    await knex.raw('CREATE TABLE losos(id int primary key, name varchar(255));');
    await knex.raw('CREATE TABLE example(id int primary key, name varchar(255), lososId int, foreign key (lososId) references losos(id));');
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1;');
    for (let i = 1; i <= 5; i++) {
      await knex.raw(`INSERT INTO losos(id, name) values(${i}, 'losos_${i}')`);
      await knex.raw(`INSERT INTO example(id, name, lososId) values(${i}, 'name_${i}', ${i})`);
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
    await knex.destroy();
  });

  it('Basic fetch', async () => {
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(1);
    expect(data.items[1].name).toEqual('name_2');
  });

  it('Or fetch', async () => {
    dto.filter = [[{
      value: ['2'],
      operator: Operator.EQ,
      column: 'id',
    }, {
      value: ['3'],
      operator: Operator.EQ,
      column: 'id',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(2);
  });

  it('Join filter', async () => {
    dto.filter = [[{
      value: ['2'],
      operator: Operator.EQ,
      column: 'losos',
    }, {
      value: ['3'],
      operator: Operator.EQ,
      column: 'losos',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(2);
  });

  it('Join sorter & filter', async () => {
    dto.filter = [[{
      value: ['2'],
      operator: Operator.EQ,
      column: 'losos',
    }, {
      value: ['3'],
      operator: Operator.EQ,
      column: 'losos',
    }]];
    dto.sorter = [
      {
        column: 'losos',
        direction: Direction.DESC,
      },
    ];
    const data = await grid.filter(dto);
    const dd = data.items[0];
    expect(data.items.length).toEqual(2);
    expect(data.items[0].id).toEqual(3);
  });

  it('And fetch', async () => {
    dto.filter = [[{
      value: ['2'],
      operator: Operator.EQ,
      column: 'id',
    }], [{
      value: ['3'],
      operator: Operator.EQ,
      column: 'id',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(0);
  });

  it('Last page', async () => {
    dto.paging!.page = 3;
    const data = await grid.filter(dto);
    expect(data.paging.total).toEqual(5);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].id).toEqual(5);
    expect(data.items[0].name).toEqual('name_5');
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
      value: ['name_3'],
      operator: Operator.EQ,
      column: 'namae',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].name).toEqual('name_3');
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
    dto.search = '_3';
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(1);
    expect(data.items[0].id).toEqual(3);
  });

  it('Search with filter', async () => {
    dto.search = '3';
    dto.filter = [[{
      value: ['3'],
      operator: Operator.GT,
      column: 'id',
    }]];
    const data = await grid.filter(dto);
    expect(data.items.length).toEqual(0);
  });

});

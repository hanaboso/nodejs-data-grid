import { DataSource } from 'typeorm';
import { Direction, Operator } from '../../../lib/GridRequestDto';
import Category from '../../TypeORM/Category';
import Grid from '../../TypeORM/Grid';
import Item from '../../TypeORM/Item';
import Tag from '../../TypeORM/Tag';

describe('TypeORM', () => {
    let dataSource: DataSource;
    let grid: Grid;

    const categories: Category[] = [];
    const items: Item[] = [];
    const tags: Tag[] = [];

    beforeAll(async () => {
        dataSource = await new DataSource({
            type: 'mariadb',
            url: process.env.MARIADB_DSN,
            entities: [Item, Category, Tag],
            synchronize: true,
        }).initialize();
        await dataSource.synchronize(true);

        grid = new Grid(dataSource);

        for (let i = 1; i < 10; i += 1) {
            const category = new Category();
            category.name = `Category Name ${i}`;
            category.description = `Category Description ${i}`;
            categories.push(category);
        }

        for (let i = 1; i < 10; i += 1) {
            const tagOne = new Tag();
            tagOne.name = `Tag Name ${i}`;
            tagOne.description = `Tag One Description ${i}`;
            tags.push(tagOne);

            const tagTwo = new Tag();
            tagTwo.name = `Tag Name ${i}`;
            tagTwo.description = `Tag Two Description ${i}`;
            tags.push(tagTwo);

            const item = new Item();
            item.name = `Item Name ${i}`;
            item.description = `Item Description ${i}`;
            item.category = categories[i - 1];
            item.tags = [tagOne, tagTwo];
            items.push(item);
        }

        await dataSource.getRepository(Category).save(categories);
        await dataSource.getRepository(Item).save(items);
        await dataSource.getRepository(Tag).save(tags);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    it('Test', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemName',
                        value: ['Item Name 5'],
                        operator: Operator.EQ,
                    }, {
                        column: 'itemDescription',
                        value: ['Item Description 5'],
                        operator: Operator.EQ,
                    },
                ], [
                    {
                        column: 'categoryName',
                        value: ['Category Name 5'],
                        operator: Operator.EQ,
                    }, {
                        column: 'categoryDescription',
                        value: ['Category Description 5'],
                        operator: Operator.EQ,
                    },
                ], [
                    {
                        column: 'tagName',
                        value: ['Tag Name 5'],
                        operator: Operator.EQ,
                    }, {
                        column: 'tagDescription',
                        value: ['Tag Description 5'],
                        operator: Operator.EQ,
                    },
                ], [
                    {
                        column: 'namesAndDescriptions',
                        value: ['Name%Description'],
                        operator: Operator.LIKE,
                    },
                ],
            ],
            sorter: [
                {
                    column: 'itemName',
                    direction: Direction.ASC,
                }, {
                    column: 'itemDescription',
                    direction: Direction.DESC,
                }, {
                    column: 'categoryName',
                    direction: Direction.ASC,
                }, {
                    column: 'categoryDescription',
                    direction: Direction.DESC,
                }, {
                    column: 'tagName',
                    direction: Direction.ASC,
                }, {
                    column: 'tagDescription',
                    direction: Direction.DESC,
                }, {
                    column: 'namesAndDescriptions',
                    direction: Direction.ASC,
                },
            ],
            search: 'Name',
            paging: {
                page: 1,
                itemsPerPage: 10,
            },
        });

        expect(response.items).toEqual([items[4]]);
    });

    it('Test WHERE ==', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.EQ,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual([items[4]]);
    });

    it('Test WHERE !=', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.NEQ,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id !== 5));
    });

    it('Test WHERE IN', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.IN,
                        value: ['1', '9'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => [1, 9].includes(id)));
    });

    it('Test WHERE NOT IN', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.NIN,
                        value: ['1', '9'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => ![1, 9].includes(id)));
    });

    it('Test WHERE <<', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.LT,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id < 5));
    });

    it('Test WHERE <=', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.LTE,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id <= 5));
    });

    it('Test WHERE =>', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.GTE,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id >= 5));
    });

    it('Test WHERE >>', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.GT,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id > 5));
    });

    it('Test WHERE LIKE', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.LIKE,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id.toString().includes('5')));
    });

    it('Test WHERE STARTS', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.STARTS,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id.toString().startsWith('5')));
    });

    it('Test WHERE ENDS', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.ENDS,
                        value: ['5'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => id.toString().endsWith('5')));
    });

    it('Test WHERE NULL', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.EMPTY,
                        value: [],
                    },
                ],
            ],
        });

        expect(response.items).toEqual([]);
    });

    it('Test WHERE NOT NULL', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.NEMPTY,
                        value: [],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items);
    });

    it('Test WHERE BETWEEN', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.BETWEEN,
                        value: ['4', '6'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => [4, 5, 6].includes(id)));
    });

    it('Test WHERE NOT BETWEEN', async () => {
        const response = await grid.filter({
            filter: [
                [
                    {
                        column: 'itemId',
                        operator: Operator.NBETWEEN,
                        value: ['4', '6'],
                    },
                ],
            ],
        });

        expect(response.items).toEqual(items.filter(({ id }) => ![4, 5, 6].includes(id)));
    });
});

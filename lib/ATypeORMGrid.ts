import { randomBytes } from 'crypto';
import {
    BaseEntity,
    Brackets,
    DataSource,
    ObjectType,
    Repository,
    SelectQueryBuilder,
    WhereExpressionBuilder,
} from 'typeorm';
import GridError from './GridError';
import { Direction, IGridRequestDto, IGridRequestDtoFilter, Operator } from './GridRequestDto';
import GridResponse from './GridResponse';

export type ICallbackFilter = (queryBuilder: WhereExpressionBuilder, operator: Operator, values: string[]) => void;

export type ICallbackSorter = <T extends BaseEntity>(queryBuilder: SelectQueryBuilder<T>, direction: Direction) => void;

export default abstract class ATypeORMGrid<T extends BaseEntity> {

    public constructor(private readonly dataSource: DataSource) {}

    protected abstract getEntity(): ObjectType<T>;

    protected abstract getQueryBuilder(repository: Repository<T>): SelectQueryBuilder<T>;

    protected abstract getFilters(): Record<string, ICallbackFilter | string>;

    protected abstract getSorters(): Record<string, ICallbackSorter | string>;

    protected abstract getSearches(): string[];

    public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
        const queryBuilder = this.getQueryBuilder(this.dataSource.getRepository(this.getEntity()));

        this.addFilters(queryBuilder, dto);
        this.addSorters(queryBuilder, dto);
        this.addPaging(queryBuilder, dto);

        const [items, count] = await queryBuilder.getManyAndCount();

        return new GridResponse(items, count, dto);
    }

    protected addOrExpression(
        queryBuilder: WhereExpressionBuilder,
        column: string,
        operator: Operator,
        values: string[],
    ): void {
        const hashOne = randomBytes(10).toString('hex');
        const hashTwo = randomBytes(10).toString('hex');
        const getValueOne = (): string => values[0] ?? (() => {
            throw new GridError(`Operator ${operator}: Missing 1st value!`);
        })();
        const getValueTwo = (): string => values[1] ?? (() => {
            throw new GridError(`Operator ${operator}: Missing 2nd value!`);
        })();

        switch (operator) {
            case Operator.EQ:
                queryBuilder.orWhere(`${column} = :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.NEQ:
                queryBuilder.orWhere(`${column} != :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.IN:
                queryBuilder.orWhere(`${column} IN (:${hashOne})`, { [hashOne]: values });
                break;

            case Operator.NIN:
                queryBuilder.orWhere(`${column} NOT IN (:${hashOne})`, { [hashOne]: values });
                break;

            case Operator.GT:
                queryBuilder.orWhere(`${column} > :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.LT:
                queryBuilder.orWhere(`${column} < :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.GTE:
                queryBuilder.orWhere(`${column} >= :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.LTE:
                queryBuilder.orWhere(`${column} <= :${hashOne}`, { [hashOne]: getValueOne() });
                break;

            case Operator.LIKE:
                queryBuilder.orWhere(`${column} LIKE :${hashOne}`, { [hashOne]: `%${getValueOne()}%` });
                break;

            case Operator.STARTS:
                queryBuilder.orWhere(`${column} LIKE :${hashOne}`, { [hashOne]: `${getValueOne()}%` });
                break;

            case Operator.ENDS:
                queryBuilder.orWhere(`${column} LIKE :${hashOne}`, { [hashOne]: `%${getValueOne()}` });
                break;

            case Operator.NEMPTY:
                queryBuilder.orWhere(`${column} IS NOT NULL`);
                break;

            case Operator.EMPTY:
                queryBuilder.orWhere(`${column} IS NULL`);
                break;

            case Operator.BETWEEN:
                queryBuilder.orWhere(`${column} BETWEEN :${hashOne} AND :${hashTwo}`, {
                    [hashOne]: getValueOne(),
                    [hashTwo]: getValueTwo(),
                });
                break;

            case Operator.NBETWEEN:
                queryBuilder.orWhere(`${column} NOT BETWEEN :${hashOne} AND :${hashTwo}`, {
                    [hashOne]: getValueOne(),
                    [hashTwo]: getValueTwo(),
                });
                break;

            default:
                queryBuilder.orWhere(`${column} = :${hashOne}`, { [hashOne]: getValueOne() });
                break;
        }
    }

    private getFilterColumn(key: string): ICallbackFilter | string {
        const filters = this.getFilters();

        if (key in filters) {
            return filters[key];
        }

        throw new GridError(`Column ${key} cannot be used for filtering!`);
    }

    private getSorterColumn(key: string): ICallbackSorter | string {
        const sorters = this.getSorters();

        if (key in sorters) {
            return sorters[key];
        }

        throw new GridError(`Column ${key} cannot be used for sorting!`);
    }

    private addFilters(queryBuilder: SelectQueryBuilder<T>, dto: IGridRequestDto): void {
        const andFilters = [...dto.filter ?? [], ...dto.additionalFilter ?? []];

        for (const orFilters of andFilters) {
            queryBuilder.andWhere(new Brackets((innerQueryBuilder) => {
                for (const orFilter of orFilters) {
                    this.addFilter(innerQueryBuilder, orFilter);
                }
            }));
        }

        const { search } = dto;
        const searches = this.getSearches();

        if (search && searches.length) {
            queryBuilder.andWhere(new Brackets((innerQueryBuilder) => {
                for (const innerSearch of this.getSearches()) {
                    this.addFilter(
                        innerQueryBuilder,
                        {
                            column: innerSearch,
                            operator: Operator.LIKE,
                            value: [search],
                        },
                    );
                }
            }));
        }
    }

    private addSorters(queryBuilder: SelectQueryBuilder<T>, dto: IGridRequestDto): void {
        const sorters = [...dto.sorter ?? [], ...dto.additionalSorter ?? []];

        for (const sorter of sorters) {
            const innerSorter = this.getSorterColumn(sorter.column);

            if (typeof innerSorter === 'string') {
                queryBuilder.addOrderBy(innerSorter, sorter.direction);
            } else {
                innerSorter(queryBuilder, sorter.direction);
            }
        }
    }

    private addFilter(queryBuilder: WhereExpressionBuilder, { column, operator, value }: IGridRequestDtoFilter): void {
        const innerColumn = this.getFilterColumn(column);

        if (typeof innerColumn === 'string') {
            this.addOrExpression(queryBuilder, innerColumn, operator, value);
        } else {
            queryBuilder.orWhere(new Brackets((innerQueryBuilder) => {
                innerColumn(innerQueryBuilder, operator, value);
            }));
        }
    }

    private addPaging(queryBuilder: SelectQueryBuilder<T>, dto: IGridRequestDto): void {
        const paging = dto.paging ?? {
            page: 1,
            itemsPerPage: 10,
        };

        paging.page = Math.max(paging.page, 1);
        paging.itemsPerPage = Math.max(paging.itemsPerPage, 1);
        dto.paging = paging; // eslint-disable-line no-param-reassign

        queryBuilder
            .take(paging.itemsPerPage)
            .skip((paging.page - 1) * paging.itemsPerPage);
    }

}

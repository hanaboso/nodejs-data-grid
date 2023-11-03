import { Knex } from 'knex';
import GridError from './GridError';
import { Direction, IGridRequestDto, IGridRequestDtoFilter, IGridRequestDtoSorter, Operator } from './GridRequestDto';
import GridResponse from './GridResponse';

export type ICallbackFilter = (
    queryBuilder: Knex.QueryBuilder,
    column: string,
    operator: Operator,
    values: string[],
) => Knex.QueryBuilder;

export type ICallbackSorter = (
    queryBuilder: Knex.QueryBuilder,
    column: string,
    direction: Direction,
) => Knex.QueryBuilder;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default abstract class AKnexGrid<T> {

    protected filterableColumns: Record<string, ICallbackFilter | string> | null = null;

    protected sortableColumns: Record<string, ICallbackSorter | string> | null = null;

    protected searchableColumns: string[] | null = null;

    public constructor(private readonly knex: Knex) {
    }

    protected abstract searchQuery(knex: Knex, dto: IGridRequestDto): any;

    protected abstract toObject(data: Record<string, unknown>): T;

    public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
        let query = this.searchQuery(this.knex, dto);
        query = this.addFilters(query, dto);
        const countRes = await this.countQuery(query.clone().clear('select').clear('group'));
        query = this.addSorters(query, dto);
        query = this.addPaging(query, dto);

        const result = await query;
        const count = countRes[0]?.count ?? 0;

        return new GridResponse(result.map((item: any) => this.toObject(item)), count, dto);
    }

    protected async countQuery(knex: Knex): Promise<any> {
        return knex.count('*', { as: 'count' });
    }

    private static addOrExpression(query: any, filter: IGridRequestDtoFilter): any {
        switch (filter.operator) {
            case Operator.EQ:
                return query.orWhere(filter.column, filter.value[0]);
            case Operator.NEQ:
                return query.orWhereNot(filter.column, filter.value[0]);
            case Operator.IN:
                return query.orWhereIn(filter.column, filter.value);
            case Operator.NIN:
                return query.orWhereNotIn(filter.column, filter.value);
            case Operator.GT:
                return query.orWhere(filter.column, '>', filter.value[0]);
            case Operator.LT:
                return query.orWhere(filter.column, '<', filter.value[0]);
            case Operator.GTE:
                return query.orWhere(filter.column, '>=', filter.value[0]);
            case Operator.LTE:
                return query.orWhere(filter.column, '<=', filter.value[0]);
            case Operator.LIKE:
                return query.orWhereLike(filter.column, `%${filter.value[0]}%`);
            case Operator.ILIKE:
                return query.orWhereILike(filter.column, `%${filter.value[0]}%`);
            case Operator.STARTS:
                return query.orWhereLike(filter.column, `${filter.value[0]}%`);
            case Operator.ENDS:
                return query.orWhereLike(filter.column, `%${filter.value[0]}`);
            case Operator.NEMPTY:
                return query.orWhereNotNull(filter.column);
            case Operator.EMPTY:
                return query.orWhereNull(filter.column);
            case Operator.BETWEEN:
                return query.orWhereBetween(filter.column, filter.value);
            case Operator.NBETWEEN:
                return query.orWhereNotBetween(filter.column, filter.value);
            default:
                return query.orWhere(filter.column, filter.value[0]);
        }
    }

    private addPaging(query: any, dto: IGridRequestDto): any {
        const paging = {
            page: dto?.paging?.page ?? 1,
            itemsPerPage: dto?.paging?.itemsPerPage ?? 10,
        };

        paging.page = Math.max(paging.page, 1);
        paging.itemsPerPage = Math.max(paging.itemsPerPage, 1);
        dto.paging = paging; // eslint-disable-line no-param-reassign

        return query
            .offset((paging.page - 1) * paging.itemsPerPage)
            .limit(paging.itemsPerPage);
    }

    private addSorters(query: any, dto: IGridRequestDto): any {
        let q = query;
        const allSorts: IGridRequestDtoSorter[] = JSON.parse(JSON.stringify(dto.sorter ?? []));
        if (dto.additionalSorter) {
            allSorts.push(...dto.additionalSorter);
        }

        if (allSorts.length <= 0) {
            return q;
        }

        allSorts.forEach((sorter) => {
            const sColumn = sorter.column;

            if (this.sortableColumns !== null && sColumn in this.sortableColumns) {
                const column = this.sortableColumns[sColumn];

                if (typeof column === 'string') {
                    q = q.orderByRaw(`${column} ${sorter.direction.toLowerCase()}`);
                } else {
                    q = column(q, sColumn, sorter.direction);
                }
            } else {
                throw new GridError(`[${sColumn}] is not allowed for sorting`);
            }
        });

        return q;
    }

    private addFilters(query: any, dto: IGridRequestDto): any {
        let q = query;
        const allFilters: IGridRequestDtoFilter[][] = JSON.parse(JSON.stringify(dto.filter ?? []));
        if (dto.additionalFilter) {
            allFilters.push(...dto.additionalFilter);
        }

        const that = this; // eslint-disable-line
        if (allFilters.length > 0) {
            allFilters.forEach((and) => {
                q = q.andWhere(function() {
                    // @ts-expect-error Intentionally
                    let innerQ = this; // eslint-disable-line

                    and.forEach((or) => {
                        const column = that.getFilterableColumn(or.column);

                        if (typeof column === 'string') {
                            innerQ = AKnexGrid.addOrExpression(
                                innerQ,
                                {
                                    column,
                                    value: or.value,
                                    operator: or.operator,
                                },
                            );
                        } else {
                            innerQ = column(innerQ, or.column, or.operator, or.value);
                        }
                    });
                });
            });
        }

        if (dto.search && (this.searchableColumns?.length ?? 0) > 0) {
            q = q.andWhere(function() {
                // @ts-expect-error Intentionally
                let innerQ = this; // eslint-disable-line

                that.searchableColumns?.forEach((sColumn) => {
                    const column = that.getFilterableColumn(sColumn);

                    if (typeof column === 'string') {
                        innerQ = AKnexGrid.addOrExpression(
                            innerQ,
                            { column, value: [dto.search ?? ''], operator: Operator.ILIKE },
                        );
                    } else {
                        innerQ = column(innerQ, sColumn, Operator.ILIKE, [dto.search ?? '']);
                    }
                });
            });
        }

        return q;
    }

    private getFilterableColumn(name: string): ICallbackFilter | string {
        if (this.filterableColumns !== null && name in this.filterableColumns) {
            return this.filterableColumns[name];
        }

        throw new GridError(`[${name}] is not allowed for filtering`);
    }

}

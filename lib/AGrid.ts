import { ClassType } from '@deepkit/core';
import { Database, FilterQuery, OrmEntity, Query } from '@deepkit/orm';
import GridError from './GridError';
import {
    IGridRequestDto,
    IGridRequestDtoFilter,
    IGridRequestDtoSorter,
    Operator,
} from './GridRequestDto';
import GridResponse from './GridResponse';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default abstract class AGrid<T extends OrmEntity> {

    protected abstract entity: ClassType;

    protected filterableColumns: Record<string, string> | null = null;

    protected sortableColumns: Record<string, string> | null = null;

    protected searchableColumns: string[] | null = null;

    public constructor(private readonly db: Database) {
    }

    public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
        let query = this.searchQuery(this.db.query(this.entity));
        const filters = this.addFilter(dto);
        // Must be checked for SoftDelete plugin
        if (!AGrid.isFilterEmpty(filters)) {
            query = query.filter(filters);
        }

        const count = await query.count();

        query = this.addSorter(query, dto);
        query = this.addPaging(query, dto);
        const result = await query.find();

        return new GridResponse(result, count, dto);
    }

    protected searchQuery(query: Query<T>): Query<T> {
        return query;
    }

    private static isFilterEmpty(filters: FilterQuery<any>): boolean {
        if (!filters) {
            return true;
        }
        if (Object.keys(filters).length === 1 && filters.$and) {
            return filters.$and.length <= 0;
        }

        return false;
    }

    private static createExpression(filter: IGridRequestDtoFilter): any {
        switch (filter.operator) {
            case Operator.EQ:
                return filter.value[0];
            case Operator.NEQ:
                return { $ne: filter.value[0] };
            case Operator.IN:
                return { $in: filter.value };
            case Operator.NIN:
                return { $nin: filter.value };
            case Operator.GT:
                return { $gt: filter.value[0] };
            case Operator.LT:
                return { $lt: filter.value[0] };
            case Operator.GTE:
                return { $gte: filter.value[0] };
            case Operator.LTE:
                return { $lte: filter.value[0] };
            case Operator.LIKE:
                return { $regex: filter.value[0] };
            case Operator.STARTS:
                return { $regex: `^${filter.value[0]}` };
            case Operator.ENDS:
                return { $regex: `${filter.value[0]}$` };
            case Operator.NEMPTY:
                return { $ne: null };
            case Operator.EMPTY:
                return { $eq: null };
            case Operator.BETWEEN:
                return {
                    $gte: filter.value[0],
                    $lte: filter.value[1],
                };
            case Operator.NBETWEEN:
                return {
                    $gte: filter.value[1],
                    $lte: filter.value[0],
                };
            default:
                return filter.value;
        }
    }

    private addPaging(query: Query<T>, dto: IGridRequestDto): Query<T> {
        const paging = dto.paging ?? {
            page: 1,
            itemsPerPage: 10,
        };

        paging.page = Math.max(paging.page, 1);
        paging.itemsPerPage = Math.max(paging.itemsPerPage, 1);
        dto.paging = paging; // eslint-disable-line no-param-reassign

        return query
            .skip((paging.page - 1) * paging.itemsPerPage)
            .limit(paging.itemsPerPage);
    }

    private addSorter(query: Query<T>, dto: IGridRequestDto): Query<T> {
        const allSorts: IGridRequestDtoSorter[] = JSON.parse(JSON.stringify(dto.sorter ?? []));
        if (dto.additionalSorter) {
            allSorts.push(...dto.additionalSorter);
        }

        if (allSorts.length <= 0) {
            return query;
        }

        let sorted = query;
        allSorts.forEach((sorter) => {
            let { column } = sorter;
            if (this.sortableColumns !== null) {
                if (column in this.sortableColumns) {
                    column = this.sortableColumns[column];
                } else {
                    throw new GridError(`[${column}] is not allowed for sorting`);
                }
            }
            // @ts-expect-error Intentionally
            sorted = sorted.orderBy(column, sorter.direction.toLowerCase() as 'asc' | 'desc');
        });

        return sorted;
    }

    private addFilter(dto: IGridRequestDto): FilterQuery<T> {
        const filter: FilterQuery<any> = { $and: [] };
        const allFilters: IGridRequestDtoFilter[][] = JSON.parse(JSON.stringify(dto.filter ?? []));
        if (dto.additionalFilter) {
            allFilters.push(...dto.additionalFilter);
        }

        if (allFilters.length > 0) {
            allFilters.forEach((and) => {
                const orFilter: FilterQuery<any>[] = [];
                and.forEach((or) => {
                    const column = this.getFilterableColumn(or.column);
                    orFilter.push({ [column]: AGrid.createExpression(or) });
                });

                if (filter.$and) {
                    filter.$and.push({ $or: orFilter });
                }
            });
        }

        if (dto.search) {
            const searches: FilterQuery<any>[] = [];
            this.searchableColumns?.forEach((column) => {
                const name = this.getFilterableColumn(column);
                searches.push({ [name]: { $regex: dto.search } });
            });

            if (filter.$and) {
                filter.$and.push({ $or: searches });
            }
        }

        return filter;
    }

    private getFilterableColumn(name: string): string {
        let column = name;
        if (this.filterableColumns !== null) {
            if (column in this.filterableColumns) {
                column = this.filterableColumns[column];
            } else {
                throw new GridError(`[${column}] is not allowed for filtering`);
            }
        }

        return column;
    }

}

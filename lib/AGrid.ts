import { Database, Query } from '@deepkit/orm';
import { ClassType } from '@deepkit/core';
import {
  IGridRequestDto,
  IGridRequestDtoFilter,
  IGridRequestDtoSorter,
  Operator,
} from './GridRequestDto';
import GridResponse from './GridResponse';

export type FilterList = Record<string, Record<string, any>>;

export default abstract class AGrid<T> {

  constructor(private db: Database) {
  }

  protected abstract entity: ClassType;

  protected filterableColumns: Record<string, string> | null = null;

  protected sortableColumns: Record<string, string> | null = null;

  protected searchableColumns: string[] | null = null;

  public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
    const filters = this.parseFilter(dto);
    let query = this.searchQuery(this.db.query(this.entity), filters);

    const count = await query.count();

    query = this.addSorter(query, dto);
    query = this.addPaging(query, dto);
    const result = await query.find();

    return new GridResponse(result, count, dto);
  }

  protected searchQuery(query: Query<any>, filters: FilterList): Query<any> {
    return query.filter(filters['']);
  }

  private addPaging(query: Query<any>, dto: IGridRequestDto): Query<any> {
    const paging = dto.paging || {
      page: 1,
      itemsPerPage: 10,
    };

    paging.page = Math.max(paging.page, 1);
    paging.itemsPerPage = Math.max(paging.itemsPerPage, 1);
    dto.paging = paging; // eslint-disable-line

    return query
      .skip((paging.page - 1) * paging.itemsPerPage)
      .limit(paging.itemsPerPage);
  }

  private addSorter(query: Query<any>, dto: IGridRequestDto): Query<any> {
    const allSorts: IGridRequestDtoSorter[] = JSON.parse(JSON.stringify(dto.sorter || []));
    if (dto.additionalSorter) {
      allSorts.push(...dto.additionalSorter);
    }

    if (allSorts.length <= 0) {
      return query;
    }

    let sorted = query;
    allSorts.forEach(sorter => {
      let column = sorter.column;
      if (this.sortableColumns != null) {
        if (column in this.sortableColumns) {
          column = this.sortableColumns[column];
        } else {
          throw new Error(`[${column}] is not allowed for sorting`);
        }
      }
      sorted = sorted.orderBy(column, sorter.direction.toLowerCase() as 'asc' | 'desc');
    });

    return sorted;
  }

  private parseFilter(dto: IGridRequestDto): FilterList {
    const filters: FilterList = {};
    const allFilters: IGridRequestDtoFilter[][] = JSON.parse(JSON.stringify(dto.filter || []));
    if (dto.additionalFilter) {
      allFilters.push(...dto.additionalFilter);
    }

    if (allFilters.length > 0) {
      allFilters.forEach(and => {
        const orFilters: Record<string, Record<string, any>[]> = {};
        and.forEach(or => {
          const { table, column} = this.getFilterableColumn(or.column);
          if (!(table in orFilters)) {
              orFilters[table] = [];
          }

          orFilters[table].push({ [column]: AGrid.createExpression(or) });
        });

        Object.entries(orFilters).forEach(([table, filter]) => {
            if (!(table in filters)) {
                filters[table] = { $and: [] };
            }
            filters[table].$and.push({ $or: filter });
        });
      });
    }

    if (dto.search) {
      const searches: Record<string, Record<string, any>[]> = {};
      this.searchableColumns?.forEach(sColumn => {
        const { table, column } = this.getFilterableColumn(sColumn);
        if (!(table in searches)) {
            searches[table] = [];
        }

        searches[table].push({ [column]: { $regex: dto.search } });
      });

        Object.entries(searches).forEach(([table, filter]) => {
            if (!(table in filters)) {
                filters[table] = { $and: [] };
            }
            filters[table].$and.push({ $or: filter });
        });
    }

    return filters;
  }

  private getFilterableColumn(name: string): { column: string, table: string } {
    let column = name;
    if (this.filterableColumns != null) {
      if (column in this.filterableColumns) {
        column = this.filterableColumns[column];
      } else {
        throw new Error(`[${column}] is not allowed for filtering`);
      }
    }

    const parts = column.split('.', 2);

    return {
        table: parts.length > 1 ? parts[0] : '',
        column: parts.length > 1 ? parts[1] : parts[0],
    };
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
    }

    return filter.value;
  }

}

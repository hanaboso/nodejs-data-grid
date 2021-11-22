import { Database, Query } from '@deepkit/orm';
import { ClassType } from '@deepkit/core';
import { IGridRequestDto, IGridRequestDtoFilter, Operator } from './GridRequestDto';
import GridResponse from './GridResponse';

export default abstract class AGrid<T> {

  constructor(private db: Database) {
  }

  protected abstract entity: ClassType;

  protected filterableColumns: Record<string, string> | null = null;

  protected sortableColumns: Record<string, string> | null = null;

  protected searchableColumns: string[] | null = null;

  public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
    let query = this.searchQuery(this.db.query(this.entity)).filter(this.addFilter(dto));
    const count = await query.count();

    query = this.addSorter(query, dto);
    query = this.addPaging(query, dto);
    const result = await query.find();

    return new GridResponse(result, count, dto);
  }

  protected searchQuery(query: Query<any>): Query<any> {
    return query;
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
    if (!dto.sorter) {
      return query;
    }

    let sorted = query;
    dto.sorter.forEach(sorter => {
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

  private addFilter(dto: IGridRequestDto): Record<string, any> {
    const filter: Record<string, any> = { $and: [] };

    if (dto.filter && dto.filter.length > 0) {
      dto.filter.forEach(and => {
        const orFilter: Record<string, any> = {};
        and.forEach(or => {
          const column = this.getFilterableColumn(or.column);
          orFilter[column] = AGrid.createExpression(or);
        });

        filter.$and.push(orFilter);
      });
    }

    if (dto.search) {
      const searches: Record<string, any> = {};
      this.searchableColumns?.forEach(column => {
        const name = this.getFilterableColumn(column);
        searches[name] = { $regex: dto.search };
      });
      filter.$and.push(searches);
    }

    return filter;
  }

  private getFilterableColumn(name: string): string {
    let column = name;
    if (this.filterableColumns != null) {
      if (column in this.filterableColumns) {
        column = this.filterableColumns[column];
      } else {
        throw new Error(`[${column}] is not allowed for filtering`);
      }
    }

    return column;
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

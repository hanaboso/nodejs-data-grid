import { Knex } from 'knex';
import { IGridRequestDto, IGridRequestDtoFilter, IGridRequestDtoSorter, Operator } from './GridRequestDto';
import GridResponse from './GridResponse';

export type FilterList = Record<string, Record<string, any>>;

export default abstract class AKnexGrid<T> {

  constructor(private knex: Knex) {
  }

  protected filterableColumns: Record<string, string> | null = null;

  protected sortableColumns: Record<string, string> | null = null;

  protected searchableColumns: string[] | null = null;

  // @ts-ignore
  protected abstract searchQuery(knex: Knex);

  protected abstract toObject(data: Record<string, unknown>): T;

  public async filter(dto: IGridRequestDto): Promise<GridResponse<T>> {
    let query = this.searchQuery(this.knex);
    query = this.addFilters(query, dto);
    const countRes = await query.clone().clear('select').count();
    query = this.addSorters(query, dto);
    query = this.addPaging(query, dto);

    const result = await query;
    const count = countRes[0]?.['count(*)'] ?? 0;

    return new GridResponse(result.map(this.toObject), count, dto);
  }

  // @ts-ignore
  private addPaging(query, dto: IGridRequestDto) {
    const paging = dto.paging || {
      page: 1,
      itemsPerPage: 10,
    };

    paging.page = Math.max(paging.page, 1);
    paging.itemsPerPage = Math.max(paging.itemsPerPage, 1);
    dto.paging = paging; // eslint-disable-line

    return query
      .offset((paging.page - 1) * paging.itemsPerPage)
      .limit(paging.itemsPerPage);
  }

  // @ts-ignore
  private addSorters(query, dto: IGridRequestDto) {
    let q = query;
    const allSorts: IGridRequestDtoSorter[] = JSON.parse(JSON.stringify(dto.sorter || []));
    if (dto.additionalSorter) {
      allSorts.push(...dto.additionalSorter);
    }

    if (allSorts.length <= 0) {
      return q;
    }

    allSorts.forEach(sorter => {
      let column = sorter.column;
      if (this.sortableColumns != null) {
        if (column in this.sortableColumns) {
          column = this.sortableColumns[column];
        } else {
          throw new Error(`[${column}] is not allowed for sorting`);
        }
      }
      q = q.orderByRaw(`${column} ${sorter.direction.toLowerCase()}`);
    });

    return q;
  }

  private addFilters(query: any, dto: IGridRequestDto) {
    let q = query;
    const allFilters: IGridRequestDtoFilter[][] = JSON.parse(JSON.stringify(dto.filter || []));
    if (dto.additionalFilter) {
      allFilters.push(...dto.additionalFilter);
    }

    const that = this; // eslint-disable-line
    if (allFilters.length > 0) {
      allFilters.forEach(and => {
        q = q.andWhere(function() { // eslint-disable-line
          // @ts-ignore
          let innerQ = this; // eslint-disable-line

          and.forEach(or => {
            const column = that.getFilterableColumn(or.column);
            innerQ = AKnexGrid.addOrExpression(innerQ, { column, value: or.value, operator: or.operator });
          });
        });
      });
    }

    if (dto.search && (this.searchableColumns?.length ?? 0) > 0) {
      q = q.andWhere(function() { // eslint-disable-line
        // @ts-ignore
        let innerQ = this; // eslint-disable-line

        that.searchableColumns?.forEach(sColumn => {
          const column = that.getFilterableColumn(sColumn);
          // @ts-ignore
          innerQ = AKnexGrid.addOrExpression(innerQ, { column, value: [dto.search ?? ''], operator: Operator.LIKE });
        });
      });
    }

    return q;
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

  // @ts-ignore
  private static addOrExpression(query, filter: IGridRequestDtoFilter) {
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
    }

    return query.orWhere(filter.column, filter.value[0]);
  }

}

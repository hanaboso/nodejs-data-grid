import { IGridRequestDto, IGridRequestDtoFilter, IGridRequestDtoSorter } from './GridRequestDto';

export default class GridResponse<T> {
  public items: T[];

  public filter?: IGridRequestDtoFilter[][];

  public sorter?: IGridRequestDtoSorter[];

  public search?: string;

  public paging: IPaging;

  constructor(items: T[], total: number, dto: IGridRequestDto) {
    this.items = items;
    this.search = dto.search;
    this.filter = dto.filter;
    this.sorter = dto.sorter;

    const itemsPerPage = dto.paging?.itemsPerPage || 10;
    const lastPage = Math.ceil(total / itemsPerPage);
    const page = dto.paging?.page || 1;

    this.paging = {
      page,
      itemsPerPage,
      total,
      nextPage: Math.min(page + 1, lastPage),
      lastPage,
      previousPage: Math.max(page - 1, 1),
    };
  }
}

export interface IPaging {
  page: number;
  itemsPerPage: number;
  total: number;
  nextPage: number;
  lastPage: number;
  previousPage: number;
}

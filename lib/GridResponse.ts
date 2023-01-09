import { IGridRequestDto, IGridRequestDtoFilter, IGridRequestDtoSorter } from './GridRequestDto';

export default class GridResponse<T> {

    public filter?: IGridRequestDtoFilter[][];

    public sorter?: IGridRequestDtoSorter[];

    public search?: string;

    public paging: IPaging;

    public constructor(public readonly items: T[], total: number, dto: IGridRequestDto) {
        this.items = items;
        this.search = dto.search;
        this.filter = dto.filter;
        this.sorter = dto.sorter;

        const itemsPerPage = dto.paging?.itemsPerPage ?? 10;
        const lastPage = Math.max(Math.ceil(total / itemsPerPage), 1);
        const page = dto.paging?.page ?? 1;

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

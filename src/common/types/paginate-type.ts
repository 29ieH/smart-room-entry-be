import { SortDirection } from '../enum/query.enum';

export interface PaginationParams {
  page: number;
  pageSize: number;
}
export interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
}
export interface PaginationResult<T> {
  data: T[];
  meta: PaginationMeta;
}
export interface FindOptions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, SortDirection>;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean | object>;
}

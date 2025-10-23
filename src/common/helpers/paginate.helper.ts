import { PaginationDataDto } from '../constant/pagination-data.dto';

export function getPaginationData(
  totalCount: number,
  page: number,
  pageSize: number,
): PaginationDataDto {
  const safePageSize = Math.max(Number(pageSize) || 10, 1);
  const totalItems = Number(totalCount || 0);
  const totalPages = Math.max(Math.ceil(totalItems / safePageSize), 1);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const skip = Math.max((safePage - 1) * safePageSize, 0);
  return {
    totalItems,
    totalPages,
    safePage,
    safePageSize,
    skip,
  };
}

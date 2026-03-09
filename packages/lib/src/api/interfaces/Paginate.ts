export interface PaginateMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginateResponse<T> {
  data: T[];
  meta: PaginateMeta;
}

export interface PaginateOptions {
  page: number;
  limit: number;
  search?: string;
  dateSpan?: {
    from: Date;
    to: Date;
  };
  category?: string;
  tag?: string;
  type?: string;
}

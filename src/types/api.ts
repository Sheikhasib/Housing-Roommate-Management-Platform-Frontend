export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface Paginated<T> extends ApiSuccess<T[]> {
  meta: ApiMeta;
}

export interface ApiErrorItem {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  errors?: ApiErrorItem[];
}

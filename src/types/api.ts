// Envelope shapes applied by the backend's global interceptor/filter.
// See ai-product-integration-be: src/common/interceptors/response.interceptor.ts
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// See ai-product-integration-be: src/common/filters/http-exception.filter.ts
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

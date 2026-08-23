import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';

import type { ApiErrorBody, SuccessResponse } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function extractErrorMessage(error: AxiosError<ApiErrorBody>): string {
  const body = error.response?.data;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }
  if (error.message === 'Network Error') {
    return 'Cannot reach the API — is the backend running?';
  }
  return error.message || 'Something went wrong';
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const message = extractErrorMessage(error);
    // Same `id` collapses duplicate errors (e.g. several requests failing at once because the
    // API is unreachable) into a single toast instead of stacking near-identical ones.
    toast.error(message, { id: message });
    return Promise.reject(new Error(message));
  },
);

export async function unwrap<T>(promise: Promise<{ data: SuccessResponse<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

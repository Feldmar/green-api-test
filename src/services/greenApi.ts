import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import type {
  CheckAccountResponse,
  GreenApiConfig,
  ReceiveNotificationResponse,
} from '../types/greenApi';
import { GreenApiError } from './greenApiErrorConstructor';

function extractErrorMessage(error: AxiosError<unknown>): string {
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) return data;

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.description === 'string') return obj.description;
  }

  if (error.response) return `GREEN-API вернул HTTP ${error.response.status}`;
  return error.message || 'Неизвестная ошибка GREEN-API';
}

function toGreenApiError(error: unknown): GreenApiError {
  if (error instanceof GreenApiError) return error;
  if (axios.isAxiosError(error)) {
    return new GreenApiError(
      extractErrorMessage(error),
      error.response?.status,
      error.code,
    );
  }
  if (error instanceof Error) return new GreenApiError(error.message);
  return new GreenApiError('Неизвестная ошибка');
}

export function createGreenApi(config: GreenApiConfig) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new GreenApiError('Не задана переменная VITE_API_URL');
  }

  const http: AxiosInstance = axios.create({
    baseURL: `${apiUrl}/waInstance${config.idInstance}`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30_000,
  });

  http.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toGreenApiError(error)),
  );

  const token = config.apiTokenInstance;

  async function request<T>(cfg: AxiosRequestConfig): Promise<T> {
    const { data } = await http.request<T>(cfg);
    return data;
  }

  return {
    checkAccount(phoneNumber: number) {
      return request<CheckAccountResponse>({
        url: `checkAccount/${token}`,
        method: 'POST',
        data: { phoneNumber },
      });
    },

    sendMessage(chatId: string, message: string) {
      return request<{ idMessage: string }>({
        url: `sendMessage/${token}`,
        method: 'POST',
        data: { chatId, message },
      });
    },

    // Помечает все входящие сообщения чата как прочитанные
    readChat(chatId: string) {
      return request<{ result: boolean }>({
        url: `readChat/${token}`,
        method: 'POST',
        data: { chatId },
      });
    },

    receiveNotification(receiveTimeout = 20) {
      const timeout = Math.min(Math.max(receiveTimeout, 5), 60);

      return request<ReceiveNotificationResponse | null>({
        url: `receiveNotification/${token}`,
        method: 'GET',
        params: { receiveTimeout: timeout },
        timeout: (timeout + 10) * 1000,
      });
    },

    deleteNotification(receiptId: number) {
      return request<{ result: boolean }>({
        url: `deleteNotification/${token}/${receiptId}`,
        method: 'DELETE',
      });
    },
  };
}

export type GreenApi = ReturnType<typeof createGreenApi>;

import { STORAGE_KEY } from '@/constants/storage-keys';
import { ServerResponse } from '@spike/shared';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';

type AuthTokenGetter = () => string | null | Promise<string | null>;
type UnauthorizedHandler = (error: AxiosError) => void | Promise<void>;

let getAuthToken: AuthTokenGetter | null = () =>
  SecureStore.getItem(STORAGE_KEY.TOKEN);
let onUnauthorized: UnauthorizedHandler | null = async (error) => {
  if (error?.response?.status === 401) {
    // check if there is a refresh token
    const refreshToken = SecureStore.getItem(STORAGE_KEY.REFRESH_TOKEN);
    if (!refreshToken) {
      // clear everything and initial logout
    }
  }
};

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  getAuthToken = getter;
}

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  onUnauthorized = handler;
}

export const httpService: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? '',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

httpService.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      await onUnauthorized(error);
    }

    return Promise.reject(error?.response?.data as ServerResponse<any>);
  },
);

export default httpService;

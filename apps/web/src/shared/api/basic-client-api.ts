import type { AxiosInstance } from 'axios';
import { api } from './api';

/**
 * Base class for API resource clients.
 * `this.http` is the shared axios instance — use it directly in subclasses
 * with the response-type generic: `(await this.http.get<T>(path)).data`.
 */
export class BasicClientApi {
  protected readonly basePath: string;
  /** Shared axios instance — accessible in every subclass via `this.http` */
  protected readonly http: AxiosInstance = api;

  constructor(basePath: string) {
    this.basePath = basePath.replace(/\/$/, '');
  }
}

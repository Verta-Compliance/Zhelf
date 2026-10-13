import { liveClient } from './client';
import type { ApiClient } from './types';

export type { ApiClient } from './types';

export const api: ApiClient = liveClient;

export default api;

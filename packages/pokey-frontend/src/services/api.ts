import ky from 'ky';
import { getAccessToken } from './auth';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

export const api = ky.create({
  prefixUrl: API_BASE,
  hooks: {
    beforeRequest: [
      (request): void => {
        const token = getAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});

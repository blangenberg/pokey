import ky from 'ky';

const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api';

export const api = ky.create({
  prefixUrl: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

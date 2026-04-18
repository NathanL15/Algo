declare const __ALGO_API_BASE_URL__: string;

const fallbackUrl = 'http://localhost:3000';
const rawApiBaseUrl = typeof __ALGO_API_BASE_URL__ === 'string' ? __ALGO_API_BASE_URL__ : fallbackUrl;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

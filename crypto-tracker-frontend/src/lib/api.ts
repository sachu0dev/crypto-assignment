import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export async function fetchCurrentCrypto() {
  const { data } = await api.get('/crypto/current');
  return data;
}

export async function fetchHistoricalCrypto() {
  const { data } = await api.get('/crypto/historical');
  return data;
}

export async function fetchHistoricalAverage(start: string, end: string) {
  const { data } = await api.get('/crypto/historical/average', {
    params: { start, end },
  });
  return data;
}

export async function fetchCoinHistory(symbol: string, range: string) {
  const { data } = await api.get(`/crypto/historical/${symbol}`, {
    params: { range },
  });
  return data;
}

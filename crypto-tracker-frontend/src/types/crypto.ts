// Types for crypto data used in the frontend

export interface CurrentCrypto {
  _id?: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  change24h: number;
  updatedAt?: string | Date;
}

export interface HistoricalCrypto {
  _id?: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  timestamp: string | Date;
}

export interface AverageCrypto {
  _id?: string;
  name: string;
  avgPrice: number;
  avgMarketCap: number;
  avgChange24h: number;
  symbol: string;
}

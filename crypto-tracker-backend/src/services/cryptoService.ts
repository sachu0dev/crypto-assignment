import axios from 'axios';
import CurrentCrypto from '../models/CurrentCrypto';
import HistoricalCrypto from '../models/HistoricalCrypto';
import type { FilterQuery, SortOrder } from 'mongoose';
import type { Document } from 'mongoose';

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3/coins/markets';

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

export async function fetchTop10Coins(): Promise<Coin[]> {
  const { data } = await axios.get<Coin[]>(COINGECKO_API_URL, {
    params: {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 10,
      page: 1,
      price_change_percentage: '24h',
    },
  });
  return data;
}

export async function overwriteCurrentCrypto(coins: Coin[]): Promise<void> {
  await CurrentCrypto.deleteMany({});
  await CurrentCrypto.insertMany(
    coins.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      marketCap: coin.market_cap,
      change24h: coin.price_change_percentage_24h,
    })),
  );
}

export async function appendHistoricalCrypto(coins: Coin[]): Promise<void> {
  await HistoricalCrypto.insertMany(
    coins.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      marketCap: coin.market_cap,
      // timestamp defaults to now
    })),
  );
}

type CurrentCryptoDocument = Document & {
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  change24h: number;
  updatedAt: Date;
};

export async function getCurrentCrypto({
  search = '',
  sortKey = 'marketCap',
  sortDir = 'desc',
  filterChange = 'all',
}: {
  search?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  filterChange?: 'all' | 'positive' | 'negative';
} = {}): Promise<CurrentCryptoDocument[]> {
  const query: FilterQuery<CurrentCryptoDocument> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { symbol: { $regex: search, $options: 'i' } },
    ];
  }
  if (filterChange === 'positive') {
    query.change24h = { $gt: 0 };
  } else if (filterChange === 'negative') {
    query.change24h = { $lt: 0 };
  }
  const sort: Record<string, SortOrder> = {};
  sort[sortKey] = sortDir === 'asc' ? 1 : -1;
  const result = await CurrentCrypto.find(query).sort(sort);
  return result;
}

export async function getHistoricalCrypto(): Promise<Document[]> {
  const result = await HistoricalCrypto.find({}).sort({ timestamp: -1 });
  return result;
}

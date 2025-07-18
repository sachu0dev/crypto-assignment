import axios from 'axios';
import CurrentCrypto from '../models/CurrentCrypto';
import HistoricalCrypto from '../models/HistoricalCrypto';

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

export async function getCurrentCrypto() {
  const result = await CurrentCrypto.find({}).sort({ marketCap: -1 });
  return result;
}

export async function getHistoricalCrypto() {
  const result = await HistoricalCrypto.find({}).sort({ timestamp: -1 });
  return result;
}

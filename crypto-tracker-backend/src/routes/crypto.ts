import { Router } from 'express';
import { z } from 'zod';
import {
  fetchTop10Coins,
  overwriteCurrentCrypto,
  appendHistoricalCrypto,
  getCurrentCrypto,
  getHistoricalCrypto,
} from '../services/cryptoService';

export const router = Router();

const CryptoZod = z
  .object({
    name: z.string(),
    symbol: z.string(),
    price: z.number(),
    marketCap: z.number(),
    change24h: z.number(),
    updatedAt: z.date().or(z.string()),
  })
  .passthrough();
const HistoricalZod = z
  .object({
    name: z.string(),
    symbol: z.string(),
    price: z.number(),
    marketCap: z.number(),
    timestamp: z.date().or(z.string()),
  })
  .passthrough();

router.get('/current', async (req, res, next) => {
  try {
    const {
      search = '',
      sortKey = 'marketCap',
      sortDir = 'desc',
      filterChange = 'all',
    } = req.query;
    const data = await getCurrentCrypto({
      search: String(search),
      sortKey: String(sortKey),
      sortDir: sortDir === 'asc' ? 'asc' : 'desc',
      filterChange:
        filterChange === 'positive' || filterChange === 'negative' ? filterChange : 'all',
    });
    const parsed = z.array(CryptoZod).safeParse(data);
    if (!parsed.success) return res.status(500).json({ error: 'Invalid data format' });
    res.json(parsed.data);
  } catch (err) {
    next(err);
  }
});

router.get('/historical', async (req, res, next) => {
  try {
    const data = await getHistoricalCrypto();
    const parsed = z.array(HistoricalZod).safeParse(data);
    if (!parsed.success) return res.status(500).json({ error: 'Invalid data format' });
    res.json(parsed.data);
  } catch (err) {
    next(err);
  }
});

router.post('/sync', async (req, res, next) => {
  try {
    const coins = await fetchTop10Coins();
    await overwriteCurrentCrypto(coins);
    await appendHistoricalCrypto(coins);
    res.json({ message: 'Sync successful' });
  } catch (err) {
    next(err);
  }
});

// GET /api/crypto/historical/average?start=YYYY-MM-DDTHH:mm:ss&end=YYYY-MM-DDTHH:mm:ss
router.get('/historical/average', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query parameters are required' });
    }
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    // Aggregate averages by symbol
    const result = await (
      await import('../models/HistoricalCrypto')
    ).default.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$symbol',
          name: { $first: '$name' },
          avgPrice: { $avg: '$price' },
          avgMarketCap: { $avg: '$marketCap' },
          avgChange24h: { $avg: '$change24h' },
        },
      },
      { $sort: { avgMarketCap: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/crypto/historical/:symbol?range=1d|3d|7d|30d
router.get('/historical/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { range } = req.query;
    let days = 1;
    if (range === '3d') days = 3;
    else if (range === '7d') days = 7;
    else if (range === '30d') days = 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const HistoricalCrypto = (await import('../models/HistoricalCrypto')).default;
    const data = await HistoricalCrypto.find({
      symbol: symbol.toLowerCase(),
      timestamp: { $gte: fromDate },
    }).sort({ timestamp: 1 });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

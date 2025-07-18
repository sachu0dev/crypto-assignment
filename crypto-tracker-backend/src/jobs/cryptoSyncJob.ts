import cron from 'node-cron';
import {
  fetchTop10Coins,
  overwriteCurrentCrypto,
  appendHistoricalCrypto,
} from '../services/cryptoService';

export function startCryptoSyncJob(): void {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log(`[CRON] Syncing crypto data at ${new Date().toISOString()}`);
      const coins = await fetchTop10Coins();
      await overwriteCurrentCrypto(coins);
      await appendHistoricalCrypto(coins);
      console.log('[CRON] Sync successful');
    } catch (err) {
      console.error('[CRON] Sync failed:', err);
    }
  });
}

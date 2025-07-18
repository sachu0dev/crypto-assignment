import app from './app';
import { startCryptoSyncJob } from './jobs/cryptoSyncJob';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startCryptoSyncJob();

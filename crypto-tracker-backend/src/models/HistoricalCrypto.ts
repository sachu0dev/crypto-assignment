import mongoose from 'mongoose';

const HistoricalCryptoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('HistoricalCrypto', HistoricalCryptoSchema);

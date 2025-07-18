import mongoose from 'mongoose';

const CurrentCryptoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  marketCap: { type: Number, required: true },
  change24h: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('CurrentCrypto', CurrentCryptoSchema);

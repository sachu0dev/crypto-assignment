import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { router as cryptoRouter } from './routes/crypto';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as Parameters<typeof mongoose.connect>[1])
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
});
app.use(limiter);

// API Routes
app.get('/ping', (req, res) => {
  res.send('working');
});
app.use('/v1/crypto', cryptoRouter);

// Error handling middleware
app.use(
  (
    err: Error & { status?: number },
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  },
);

export default app;

import 'express-async-errors';
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { logger, httpStream } from './utils/logger';
import { requestId } from './middlewares/requestId.middlware';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes/index';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

const app = express();

// Security & base middlewares
app.use(helmet());
// Restrict CORS to allowed origins from env
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow curl/postman
    if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// Request-ID, hogy a logban követhető legyen
app.use(requestId);

// Morgan HTTP log – combined minta + saját reqId
morgan.token('reqId', (req: any) => req.id || '-');
app.use(
  morgan(':reqId :remote-addr :method :url :status :res[content-length] - :response-time ms', {
    stream: httpStream,
    skip: () => process.env.NODE_ENV === 'test'
  })
);
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
})
// Egyszerű rate limit – (prod-ban inkább Redis store)
app.use(limiter);

app.use('/api', routes);

// Central error handler
app.use(errorHandler);

export default app;

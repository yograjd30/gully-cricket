import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import connectDB from './lib/db.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import playerRoutes from './routes/player.routes.js';
import teamRoutes from './routes/team.routes.js';
import matchRoutes from './routes/match.routes.js';
import scoringRoutes from './routes/scoring.routes.js';
import statsRoutes from './routes/stats.routes.js';

// Passport config
import './lib/passport.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Vercel behind reverse proxy (necessary for secure session cookies)
app.set('trust proxy', 1);

// ─── Security ────────────────────────────────────────────
app.use(helmet());

// Build allowed origins list
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    // In production on Vercel, allow same-origin (no origin header)
    if (process.env.VERCEL) {
      return callback(null, true);
    }
    return callback(null, true); // Be permissive for now
  },
  credentials: true,
}));

// ─── Logging ─────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.use(morgan('dev'));
}

// ─── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Sessions ────────────────────────────────────────────
const rawMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gully-cricket-hq';
const isPlaceholder = rawMongoUri.includes('<cluster>') || rawMongoUri.includes('<user>') || rawMongoUri.includes('<password>');
const mongoUrl = isPlaceholder ? 'mongodb://127.0.0.1:27017/gully-cricket-hq' : rawMongoUri;

const useMockDb = isPlaceholder || process.env.USE_MOCK_DB === 'true';

// On Vercel with a real MongoDB URI, use MongoStore. Otherwise MemoryStore for local dev.
const sessionStore = (!useMockDb && !isPlaceholder)
  ? MongoStore.create({
      mongoUrl: mongoUrl,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60, // 7 days
    })
  : new session.MemoryStore();

app.use(session({
  secret: process.env.SESSION_SECRET || 'gully-cricket-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// ─── Passport ────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Lazy DB Init Middleware ─────────────────────────────
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await connectDB();
      dbInitialized = true;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/stats', statsRoutes);

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─── 404 ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 404 });
});

// ─── Error Handler ───────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: err.status || 500,
  });
});

// ─── Start (local dev only, skipped on Vercel) ───────────
if (!process.env.VERCEL) {
  const start = async () => {
    await connectDB();
    dbInitialized = true;
    app.listen(PORT, () => {
      console.log(`🏏 Gully Cricket HQ API running on port ${PORT}`);
    });
  };
  start();
}

export default app;

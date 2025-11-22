import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './utils/logger.js';
import analyzeRouter from './routes/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트 경로
const rootDir = path.resolve(__dirname, '../../../');

// NODE_ENV 기반 환경 파일 로드
const nodeEnv = process.env.NODE_ENV || 'development';

// 환경 파일 우선순위:
// 1. .env.{NODE_ENV}.local
// 2. .env.{NODE_ENV}
// 3. .env.local
// 4. .env
const envFiles = [
  path.join(rootDir, `.env.${nodeEnv}.local`),
  path.join(rootDir, `.env.${nodeEnv}`),
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env'),
];

let loadedEnvFile: string | null = null;
for (const envFile of envFiles) {
  const result = dotenv.config({ path: envFile });
  if (!result.error) {
    loadedEnvFile = path.basename(envFile);
    break;
  }
}

const logger = createLogger();

if (loadedEnvFile) {
  logger.info(`Environment loaded from: ${loadedEnvFile}`);
} else {
  logger.warn('No environment file found, using process environment variables');
}

logger.info('Environment variables loaded successfully');
logger.info('NODE_ENV:', process.env.NODE_ENV || 'development');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/analyze', analyzeRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

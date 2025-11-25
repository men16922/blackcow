/**
 * 분석 API 라우트
 * Perplexity API를 사용한 제품 분석
 */

import { Router } from 'express';
import { createLogger } from '../utils/logger.js';
import { PerplexityAdapter } from '../services/perplexity-adapter.js';
import { RiskAnalyzer } from '../services/risk-analyzer.js';
import { DynamoDBService } from '../db/dynamodb-client.js';
import type { ProductAnalysisResult } from '@shopping-fraud-detector/shared';

const router = Router();
const logger = createLogger();

// 서비스 인스턴스
let perplexityAdapter: PerplexityAdapter | null = null;
let dbService: DynamoDBService | null = null;
const riskAnalyzer = new RiskAnalyzer();

// Lazy initialization function for Perplexity Adapter
function getPerplexityAdapter(): PerplexityAdapter {
  if (!perplexityAdapter) {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || 'pplx-7b-online';

    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    perplexityAdapter = new PerplexityAdapter(PERPLEXITY_API_KEY, PERPLEXITY_MODEL);
    logger.info('Perplexity Adapter initialized');
  }
  return perplexityAdapter;
}

// Lazy initialization function for DynamoDB Service
function getDBService(): DynamoDBService {
  if (!dbService) {
    dbService = new DynamoDBService();
    logger.info('DynamoDB Service initialized');
  }
  return dbService;
}

/**
 * 세션 가져오기 또는 생성 헬퍼 함수
 */
async function getOrCreateSession(
  productName: string,
  sessionId: string | undefined,
  userAgent: string | undefined
): Promise<import('@shopping-fraud-detector/shared').SearchSession> {
  if (sessionId) {
    const existingSession = await getDBService().getSession(sessionId);
    if (existingSession) {
      return existingSession;
    }
  }
  return await getDBService().createSession(productName, userAgent);
}

/**
 * POST /api/analyze/product
 * 제품 기본 정보 분석 (요약)
 */
router.post('/product', async (req, res) => {
  const startTime = Date.now();

  try {
    const { productName, sessionId } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: '제품명(productName)이 필요합니다.' });
    }

    logger.info('제품 정보 분석 시작', { productName, sessionId });

    // 세션 처리
    const session = await getOrCreateSession(productName, sessionId, req.headers['user-agent']);

    // 제품 요약 정보 가져오기
    const adapter = getPerplexityAdapter();
    const summary = await adapter.getProductSummary(productName);

    const processingTime = Date.now() - startTime;

    // 검색 이력 저장
    await getDBService().saveSearchHistory(
      session.sessionId,
      productName,
      'product',
      productName,
      summary,
      processingTime,
      true // success
    );

    return res.json({
      sessionId: session.sessionId,
      productName,
      summary,
      processingTime,
    });
  } catch (error) {
    logger.error('제품 정보 분석 실패', error);
    return res.status(500).json({
      error: '제품 정보 분석에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

/**
 * POST /api/analyze/price
 * 가격 비교 분석
 */
router.post('/price', async (req, res) => {
  const startTime = Date.now();

  try {
    const { productName, sessionId } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: '제품명(productName)이 필요합니다.' });
    }

    logger.info('가격 비교 분석 시작', { productName, sessionId });

    // 세션 처리
    const session = await getOrCreateSession(productName, sessionId, req.headers['user-agent']);

    // 가격 비교 정보 가져오기
    const adapter = getPerplexityAdapter();
    const priceComparison = await adapter.getPriceComparison(productName);

    const processingTime = Date.now() - startTime;

    // 검색 이력 저장
    await getDBService().saveSearchHistory(
      session.sessionId,
      productName,
      'price',
      productName,
      priceComparison,
      processingTime,
      true // success
    );

    return res.json({
      sessionId: session.sessionId,
      productName,
      priceComparison,
      processingTime,
    });
  } catch (error) {
    logger.error('가격 비교 분석 실패', error);
    return res.status(500).json({
      error: '가격 비교 분석에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

/**
 * POST /api/analyze/reviews
 * 리뷰 분석
 */
router.post('/reviews', async (req, res) => {
  const startTime = Date.now();

  try {
    const { productName, sessionId } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: '제품명(productName)이 필요합니다.' });
    }

    logger.info('리뷰 분석 시작', { productName, sessionId });

    // 세션 처리
    const session = await getOrCreateSession(productName, sessionId, req.headers['user-agent']);

    // 리뷰 요약 정보 가져오기
    const adapter = getPerplexityAdapter();
    const reviewDigest = await adapter.getReviewDigest(productName);

    const processingTime = Date.now() - startTime;

    // 검색 이력 저장
    await getDBService().saveSearchHistory(
      session.sessionId,
      productName,
      'review',
      productName,
      reviewDigest,
      processingTime,
      true // success
    );

    return res.json({
      sessionId: session.sessionId,
      productName,
      reviewDigest,
      processingTime,
    });
  } catch (error) {
    logger.error('리뷰 분석 실패', error);
    return res.status(500).json({
      error: '리뷰 분석에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

/**
 * POST /api/analyze/score
 * 종합 위험도 점수 계산
 * (제품 정보, 가격, 리뷰를 모두 분석하여 위험도 산출)
 */
router.post('/score', async (req, res) => {
  const startTime = Date.now();

  try {
    const { productName, sessionId, useCache = true } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: '제품명(productName)이 필요합니다.' });
    }

    logger.info('종합 분석 시작', { productName, sessionId, useCache });

    // 캐시 확인
    if (useCache) {
      const cached = await getDBService().getAnalysisCache(productName);
      if (cached) {
        logger.info('캐시된 분석 결과 반환', { productName });
        return res.json({
          ...cached,
          fromCache: true,
        });
      }
    }

    // 세션 처리
    const session = await getOrCreateSession(productName, sessionId, req.headers['user-agent']);

    // Perplexity Adapter 초기화
    const adapter = getPerplexityAdapter();

    // 병렬로 모든 분석 수행
    const [summary, priceComparison, reviewDigest] = await Promise.all([
      adapter.getProductSummary(productName),
      adapter.getPriceComparison(productName),
      adapter.getReviewDigest(productName),
    ]);

    // 위험도 계산
    const riskScore = riskAnalyzer.calculateRiskScore(summary, priceComparison, reviewDigest);

    const processingTime = Date.now() - startTime;

    // 최종 결과
    const analysisResult: ProductAnalysisResult = {
      sessionId: session.sessionId,
      productName,
      summary,
      priceComparison,
      reviewDigest,
      riskScore,
      analyzedAt: new Date().toISOString(),
      processingTime,
    };

    // 세션에 결과 저장 및 검색 이력 저장 (병렬 실행)
    await Promise.all([
      getDBService().updateSessionWithResult(session.sessionId, analysisResult),
      getDBService().saveSearchHistory(
        session.sessionId,
        productName,
        'risk',
        productName,
        analysisResult,
        processingTime,
        true // success
      ),
    ]);

    // 캐시 저장 (60분)
    await getDBService().saveAnalysisCache(productName, analysisResult, 60);

    logger.info('종합 분석 완료', {
      productName,
      riskScore: riskScore.score,
      processingTime,
    });

    return res.json({
      ...analysisResult,
      fromCache: false,
    });
  } catch (error) {
    logger.error('종합 분석 실패', error);
    return res.status(500).json({
      error: '종합 분석에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

/**
 * GET /api/analyze/session/:sessionId
 * 세션 정보 및 분석 결과 조회
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getDBService().getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    // 세션의 검색 이력도 함께 조회
    const history = await getDBService().getSessionHistory(sessionId);

    return res.json({
      session,
      history,
    });
  } catch (error) {
    logger.error('세션 조회 실패', error);
    return res.status(500).json({
      error: '세션 조회에 실패했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

export default router;

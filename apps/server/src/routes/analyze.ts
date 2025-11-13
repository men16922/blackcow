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

// 환경 변수 검증
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || 'pplx-7b-online';

if (!PERPLEXITY_API_KEY) {
  logger.error('PERPLEXITY_API_KEY 환경 변수가 설정되지 않았습니다.');
}

// 서비스 인스턴스
let perplexityAdapter: PerplexityAdapter | null = null;
const riskAnalyzer = new RiskAnalyzer();
const dbService = new DynamoDBService();

// Perplexity Adapter 초기화
if (PERPLEXITY_API_KEY) {
  perplexityAdapter = new PerplexityAdapter(PERPLEXITY_API_KEY, PERPLEXITY_MODEL);
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

    if (!perplexityAdapter) {
      return res.status(503).json({ error: 'Perplexity API가 설정되지 않았습니다.' });
    }

    logger.info('제품 정보 분석 시작', { productName, sessionId });

    // 제품 요약 정보 가져오기
    const summary = await perplexityAdapter.getProductSummary(productName);

    // 세션 처리
    let session = sessionId ? await dbService.getSession(sessionId) : null;
    if (!session) {
      session = await dbService.createSession(
        productName,
        req.headers['user-agent'],
        req.ip
      );
    }

    // 검색 이력 저장
    await dbService.saveSearchHistory(
      session.sessionId,
      productName,
      'product',
      productName,
      summary
    );

    const processingTime = Date.now() - startTime;

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

    if (!perplexityAdapter) {
      return res.status(503).json({ error: 'Perplexity API가 설정되지 않았습니다.' });
    }

    logger.info('가격 비교 분석 시작', { productName, sessionId });

    // 가격 비교 정보 가져오기
    const priceComparison = await perplexityAdapter.getPriceComparison(productName);

    // 세션 처리
    let session = sessionId ? await dbService.getSession(sessionId) : null;
    if (!session) {
      session = await dbService.createSession(
        productName,
        req.headers['user-agent'],
        req.ip
      );
    }

    // 검색 이력 저장
    await dbService.saveSearchHistory(
      session.sessionId,
      productName,
      'price',
      productName,
      priceComparison
    );

    const processingTime = Date.now() - startTime;

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

    if (!perplexityAdapter) {
      return res.status(503).json({ error: 'Perplexity API가 설정되지 않았습니다.' });
    }

    logger.info('리뷰 분석 시작', { productName, sessionId });

    // 리뷰 요약 정보 가져오기
    const reviewDigest = await perplexityAdapter.getReviewDigest(productName);

    // 세션 처리
    let session = sessionId ? await dbService.getSession(sessionId) : null;
    if (!session) {
      session = await dbService.createSession(
        productName,
        req.headers['user-agent'],
        req.ip
      );
    }

    // 검색 이력 저장
    await dbService.saveSearchHistory(
      session.sessionId,
      productName,
      'review',
      productName,
      reviewDigest
    );

    const processingTime = Date.now() - startTime;

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

    if (!perplexityAdapter) {
      return res.status(503).json({ error: 'Perplexity API가 설정되지 않았습니다.' });
    }

    logger.info('종합 분석 시작', { productName, sessionId, useCache });

    // 캐시 확인
    if (useCache) {
      const cached = await dbService.getAnalysisCache(productName);
      if (cached) {
        logger.info('캐시된 분석 결과 반환', { productName });
        return res.json({
          ...cached,
          fromCache: true,
        });
      }
    }

    // 세션 처리
    let session = sessionId ? await dbService.getSession(sessionId) : null;
    if (!session) {
      session = await dbService.createSession(
        productName,
        req.headers['user-agent'],
        req.ip
      );
    }

    // 병렬로 모든 분석 수행
    const [summary, priceComparison, reviewDigest] = await Promise.all([
      perplexityAdapter.getProductSummary(productName),
      perplexityAdapter.getPriceComparison(productName),
      perplexityAdapter.getReviewDigest(productName),
    ]);

    // 위험도 계산
    const riskScore = riskAnalyzer.calculateRiskScore(
      summary,
      priceComparison,
      reviewDigest
    );

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

    // 세션에 결과 저장
    await dbService.updateSessionWithResult(session.sessionId, analysisResult);

    // 검색 이력 저장
    await dbService.saveSearchHistory(
      session.sessionId,
      productName,
      'score',
      productName,
      analysisResult
    );

    // 캐시 저장 (60분)
    await dbService.saveAnalysisCache(productName, analysisResult, 60);

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

    const session = await dbService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    // 세션의 검색 이력도 함께 조회
    const history = await dbService.getSessionHistory(sessionId);

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

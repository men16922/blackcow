/**
 * ProductAnalysisService
 * 제품 분석의 전체 흐름을 조율하는 메인 서비스
 */

import type { ProductAnalysisResult, SearchSession } from '@shopping-fraud-detector/shared';
import { PerplexityAdapter } from './perplexity-adapter.js';
import { RiskAnalyzer } from './risk-analyzer.js';
import { createLogger } from '../utils/logger.js';
import { generateUUID, calculateTTL, getCurrentTimestamp } from '../utils/helpers.js';
import { AnalysisError } from '../utils/errors.js';
import type { DynamoDBService } from '../db/dynamodb-client.js';
import type { CacheService } from './cache-service.js';

const logger = createLogger();

export interface ProductAnalysisServiceDeps {
  perplexityAdapter: PerplexityAdapter;
  riskAnalyzer: RiskAnalyzer;
  cacheService?: CacheService;
  dbClient?: DynamoDBService;
}

export class ProductAnalysisService {
  private perplexityAdapter: PerplexityAdapter;
  private riskAnalyzer: RiskAnalyzer;
  private cacheService?: CacheService;
  private dbClient?: DynamoDBService;

  constructor(deps: ProductAnalysisServiceDeps) {
    this.perplexityAdapter = deps.perplexityAdapter;
    this.riskAnalyzer = deps.riskAnalyzer;
    this.cacheService = deps.cacheService;
    this.dbClient = deps.dbClient;
  }

  /**
   * 제품 분석 수행
   */
  async analyzeProduct(productName: string, productUrl?: string): Promise<ProductAnalysisResult> {
    const startTime = Date.now();

    logger.info('제품 분석 시작', { productName, productUrl });

    // 1. 세션 생성
    const session = await this.createSession(productName);

    try {
      // 2. 캐시 확인 (캐시 서비스가 있는 경우)
      if (this.cacheService) {
        const cached = await this.cacheService.get(productName);
        if (cached) {
          logger.info('캐시 히트', { productName });
          await this.updateSessionWithCache(session.sessionId, cached);
          return cached;
        }
      }

      // 3. 데이터 수집 (병렬 실행)
      logger.info('Perplexity API 호출 시작', { productName });

      const [summary, priceComparison, reviewDigest] = await Promise.all([
        this.perplexityAdapter.getProductSummary(productName),
        this.perplexityAdapter.getPriceComparison(productName),
        this.perplexityAdapter.getReviewDigest(productName),
      ]);

      logger.info('Perplexity API 호출 완료', { productName });

      // 4. 위험도 분석
      logger.info('위험도 분석 시작', { productName });

      const riskScore = this.riskAnalyzer.calculateRiskScore(
        summary,
        priceComparison,
        reviewDigest
      );

      logger.info('위험도 분석 완료', {
        productName,
        score: riskScore.score,
        level: riskScore.level,
      });

      // 5. 결과 생성
      const processingTime = Date.now() - startTime;

      const result: ProductAnalysisResult = {
        sessionId: session.sessionId,
        productName,
        summary,
        priceComparison,
        reviewDigest,
        riskScore,
        analyzedAt: getCurrentTimestamp(),
        processingTime,
      };

      // 6. 세션 업데이트 및 캐시 저장
      await this.finalizeAnalysis(session.sessionId, result);

      logger.info('제품 분석 완료', {
        productName,
        processingTime,
        riskLevel: riskScore.level,
      });

      return result;
    } catch (error) {
      // 에러 처리
      logger.error('제품 분석 실패', {
        productName,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });

      await this.failSession(session.sessionId, error as Error);

      throw new AnalysisError(
        `제품 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 세션 조회
   */
  async getSession(sessionId: string): Promise<SearchSession | null> {
    if (!this.dbClient) {
      logger.warn('DynamoDB 클라이언트가 설정되지 않음');
      return null;
    }

    try {
      const session = await this.dbClient.getItem<SearchSession>('SearchSessions', { sessionId });
      return session || null;
    } catch (error) {
      logger.error('세션 조회 실패', { sessionId, error });
      return null;
    }
  }

  /**
   * 세션 생성
   */
  private async createSession(productName: string): Promise<SearchSession> {
    const session: SearchSession = {
      sessionId: generateUUID(),
      createdAt: getCurrentTimestamp(),
      productName,
      status: 'pending',
      updatedAt: getCurrentTimestamp(),
      ttl: calculateTTL(30), // 30일 후 삭제
    };

    if (this.dbClient) {
      try {
        await this.dbClient.putItem('SearchSessions', session as unknown as Record<string, unknown>);
        logger.info('세션 생성 완료', { sessionId: session.sessionId });
      } catch (error) {
        logger.error('세션 생성 실패', { error });
      }
    }

    return session;
  }

  /**
   * 세션 업데이트 (캐시 히트)
   */
  private async updateSessionWithCache(
    sessionId: string,
    result: ProductAnalysisResult
  ): Promise<void> {
    if (!this.dbClient) return;

    try {
      await this.dbClient.updateItem(
        'SearchSessions',
        { sessionId },
        {
          status: 'completed',
          analysisResult: result,
          updatedAt: getCurrentTimestamp(),
        }
      );

      logger.info('세션 업데이트 완료 (캐시)', { sessionId });
    } catch (error) {
      logger.error('세션 업데이트 실패', { sessionId, error });
    }
  }

  /**
   * 분석 완료 처리
   */
  private async finalizeAnalysis(sessionId: string, result: ProductAnalysisResult): Promise<void> {
    const promises: Promise<unknown>[] = [];

    // 세션 업데이트
    if (this.dbClient) {
      promises.push(
        this.dbClient
          .updateItem(
            'SearchSessions',
            { sessionId },
            {
              status: 'completed',
              analysisResult: result,
              updatedAt: getCurrentTimestamp(),
            }
          )
          .then(() => logger.info('세션 업데이트 완료', { sessionId }))
          .catch((error: Error) => logger.error('세션 업데이트 실패', { sessionId, error }))
      );
    }

    // 캐시 저장
    if (this.cacheService) {
      promises.push(
        this.cacheService
          .set(result.productName, result)
          .then(() => logger.info('캐시 저장 완료', { productName: result.productName }))
          .catch((error: Error) =>
            logger.error('캐시 저장 실패', { productName: result.productName, error })
          )
      );
    }

    await Promise.allSettled(promises);
  }

  /**
   * 세션 실패 처리
   */
  private async failSession(sessionId: string, error: Error): Promise<void> {
    if (!this.dbClient) return;

    try {
      await this.dbClient.updateItem(
        'SearchSessions',
        { sessionId },
        {
          status: 'failed',
          errorMessage: error.message,
          updatedAt: getCurrentTimestamp(),
        }
      );

      logger.info('세션 실패 처리 완료', { sessionId });
    } catch (err) {
      logger.error('세션 실패 처리 실패', { sessionId, error: err });
    }
  }
}

/**
 * CacheService
 * 분석 결과를 캐싱하여 반복 분석을 방지합니다.
 */

import type { ProductAnalysisResult, AnalysisCache } from '@shopping-fraud-detector/shared';
import { createLogger } from '../utils/logger.js';
import {
  generateCacheKey,
  getCurrentTimestamp,
  calculateExpiresAt,
  calculateTTL,
  isExpired,
} from '../utils/helpers.js';
import type { DynamoDBService } from '../db/dynamodb-client.js';

const logger = createLogger();

export interface CacheServiceDeps {
  dbClient?: DynamoDBService;
}

export class CacheService {
  private dbClient?: DynamoDBService;
  private version: string = '1.0.0';
  private cacheHours: number = 24; // 캐시 유효 시간 (24시간)

  constructor(deps: CacheServiceDeps = {}) {
    this.dbClient = deps.dbClient;
  }

  /**
   * 캐시 조회
   */
  async get(productName: string): Promise<ProductAnalysisResult | null> {
    if (!this.dbClient) {
      logger.warn('DynamoDB 클라이언트가 설정되지 않아 캐시를 사용할 수 없습니다.');
      return null;
    }

    try {
      const cacheKey = generateCacheKey(productName, this.version);

      logger.info('캐시 조회 시도', { productName, cacheKey });

      const item: AnalysisCache | null = await this.dbClient.getItem<AnalysisCache>(
        'AnalysisCache',
        { cacheKey }
      );

      if (!item) {
        logger.info('캐시 미스', { productName });
        return null;
      }

      // 만료 확인
      if (isExpired(item.expiresAt)) {
        logger.info('캐시 만료', { productName, expiresAt: item.expiresAt });
        await this.invalidate(cacheKey);
        return null;
      }

      // 히트 카운트 업데이트 (비동기, 에러 무시)
      this.updateHitCount(cacheKey).catch(error => {
        logger.warn('히트 카운트 업데이트 실패', { cacheKey, error });
      });

      logger.info('캐시 히트', {
        productName,
        hitCount: item.hitCount + 1,
        createdAt: item.createdAt,
      });

      return item.analysisResult;
    } catch (error) {
      logger.error('캐시 조회 실패', {
        productName,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
      return null;
    }
  }

  /**
   * 캐시 저장
   */
  async set(productName: string, result: ProductAnalysisResult): Promise<void> {
    if (!this.dbClient) {
      logger.warn('DynamoDB 클라이언트가 설정되지 않아 캐시를 저장할 수 없습니다.');
      return;
    }

    try {
      const cacheKey = generateCacheKey(productName, this.version);
      const now = getCurrentTimestamp();
      const expiresAt = calculateExpiresAt(this.cacheHours);
      const ttl = calculateTTL(1); // 24시간 (1일)

      const cacheItem: AnalysisCache = {
        cacheKey,
        productName,
        analysisResult: result,
        createdAt: now,
        expiresAt,
        hitCount: 0,
        lastAccessedAt: now,
        version: this.version,
        ttl,
      };

      await this.dbClient.putItem('AnalysisCache', cacheItem as Record<string, unknown>);

      logger.info('캐시 저장 완료', {
        productName,
        cacheKey,
        expiresAt,
      });
    } catch (error) {
      logger.error('캐시 저장 실패', {
        productName,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  }

  /**
   * 캐시 무효화 (삭제)
   */
  async invalidate(cacheKey: string): Promise<void> {
    if (!this.dbClient) {
      return;
    }

    try {
      await this.dbClient.deleteItem('AnalysisCache', { cacheKey });
      logger.info('캐시 무효화 완료', { cacheKey });
    } catch (error) {
      logger.error('캐시 무효화 실패', {
        cacheKey,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  }

  /**
   * 제품명으로 캐시 무효화
   */
  async invalidateByProductName(productName: string): Promise<void> {
    const cacheKey = generateCacheKey(productName, this.version);
    await this.invalidate(cacheKey);
  }

  /**
   * 히트 카운트 업데이트
   */
  private async updateHitCount(cacheKey: string): Promise<void> {
    if (!this.dbClient) {
      return;
    }

    try {
      await this.dbClient.incrementField('AnalysisCache', { cacheKey }, 'hitCount', 1);

      await this.dbClient.updateItem('AnalysisCache', { cacheKey }, {
        lastAccessedAt: getCurrentTimestamp(),
      });

      logger.debug('히트 카운트 업데이트 완료', { cacheKey });
    } catch (error) {
      // 에러는 무시 (중요하지 않음)
      logger.debug('히트 카운트 업데이트 실패', { cacheKey, error });
    }
  }

  /**
   * 캐시 통계 조회 (선택적)
   */
  async getStats(productName: string): Promise<{
    exists: boolean;
    hitCount?: number;
    createdAt?: string;
    expiresAt?: string;
    lastAccessedAt?: string;
  } | null> {
    if (!this.dbClient) {
      return null;
    }

    try {
      const cacheKey = generateCacheKey(productName, this.version);
      const item: AnalysisCache | null = await this.dbClient.getItem<AnalysisCache>(
        'AnalysisCache',
        { cacheKey }
      );

      if (!item) {
        return { exists: false };
      }

      return {
        exists: true,
        hitCount: item.hitCount,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        lastAccessedAt: item.lastAccessedAt,
      };
    } catch (error) {
      logger.error('캐시 통계 조회 실패', { productName, error });
      return null;
    }
  }

  /**
   * 만료된 캐시 정리 (배치 작업용)
   */
  async cleanupExpired(): Promise<number> {
    if (!this.dbClient) {
      return 0;
    }

    try {
      logger.info('만료된 캐시 정리 시작');

      // ExpiresAtIndex를 사용하여 만료된 항목 조회
      const now = getCurrentTimestamp();
      const expiredItems = await this.dbClient.query('AnalysisCache', {
        IndexName: 'ExpiresAtIndex',
        KeyConditionExpression: 'expiresAt < :now',
        ExpressionAttributeValues: {
          ':now': now,
        },
      });

      if (!expiredItems || expiredItems.length === 0) {
        logger.info('만료된 캐시 없음');
        return 0;
      }

      // 배치 삭제
      const deletePromises = expiredItems.map((item: AnalysisCache) =>
        this.invalidate(item.cacheKey)
      );

      await Promise.all(deletePromises);

      logger.info('만료된 캐시 정리 완료', { count: expiredItems.length });

      return expiredItems.length;
    } catch (error) {
      logger.error('만료된 캐시 정리 실패', {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
      return 0;
    }
  }

  /**
   * 전체 캐시 삭제 (개발/테스트용)
   */
  async clearAll(): Promise<void> {
    if (!this.dbClient) {
      return;
    }

    logger.warn('전체 캐시 삭제 시작 (개발/테스트 전용)');

    try {
      const allItems = await this.dbClient.scan('AnalysisCache');

      if (!allItems || allItems.length === 0) {
        logger.info('삭제할 캐시 없음');
        return;
      }

      const deletePromises = allItems.map((item: AnalysisCache) =>
        this.invalidate(item.cacheKey)
      );

      await Promise.all(deletePromises);

      logger.warn('전체 캐시 삭제 완료', { count: allItems.length });
    } catch (error) {
      logger.error('전체 캐시 삭제 실패', {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  }
}

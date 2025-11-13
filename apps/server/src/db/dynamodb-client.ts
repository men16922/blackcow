/**
 * DynamoDB Client
 * AWS DynamoDB를 사용한 데이터 저장 및 조회
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  SearchSession,
  SearchHistory,
  AnalysisCache,
  ProductAnalysisResult,
} from '@shopping-fraud-detector/shared';
import { createLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: {
    sessions: string;
    history: string;
    cache: string;
  };

  constructor() {
    const baseClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      endpoint: process.env.DYNAMODB_ENDPOINT, // 로컬 개발용
    });

    this.client = DynamoDBDocumentClient.from(baseClient);

    this.tableName = {
      sessions: process.env.DYNAMODB_TABLE_SESSIONS || 'BlackCow_SearchSessions',
      history: process.env.DYNAMODB_TABLE_HISTORY || 'BlackCow_SearchHistory',
      cache: process.env.DYNAMODB_TABLE_CACHE || 'BlackCow_AnalysisCache',
    };
  }

  /**
   * 새 검색 세션 생성
   */
  async createSession(
    productName: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<SearchSession> {
    const session: SearchSession = {
      sessionId: uuidv4(),
      productName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userAgent,
      ipAddress,
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName.sessions,
          Item: session,
        })
      );

      logger.info('세션 생성됨', { sessionId: session.sessionId, productName });
      return session;
    } catch (error) {
      logger.error('세션 생성 실패', error);
      throw error;
    }
  }

  /**
   * 세션 조회
   */
  async getSession(sessionId: string): Promise<SearchSession | null> {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.tableName.sessions,
          Key: { sessionId },
        })
      );

      return (result.Item as SearchSession) || null;
    } catch (error) {
      logger.error('세션 조회 실패', error);
      return null;
    }
  }

  /**
   * 세션에 분석 결과 업데이트
   */
  async updateSessionWithResult(
    sessionId: string,
    analysisResult: ProductAnalysisResult
  ): Promise<void> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName.sessions,
          Key: { sessionId },
          UpdateExpression: 'SET analysisResult = :result, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':result': analysisResult,
            ':updatedAt': new Date().toISOString(),
          },
        })
      );

      logger.info('세션에 분석 결과 저장됨', { sessionId });
    } catch (error) {
      logger.error('세션 업데이트 실패', error);
      throw error;
    }
  }

  /**
   * 검색 이력 저장
   */
  async saveSearchHistory(
    sessionId: string,
    productName: string,
    searchType: 'product' | 'price' | 'review' | 'score',
    query: string,
    results: unknown
  ): Promise<SearchHistory> {
    const history: SearchHistory = {
      historyId: uuidv4(),
      sessionId,
      productName,
      searchType,
      query,
      results,
      createdAt: new Date().toISOString(),
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName.history,
          Item: history,
        })
      );

      logger.info('검색 이력 저장됨', {
        historyId: history.historyId,
        sessionId,
        searchType,
      });

      return history;
    } catch (error) {
      logger.error('검색 이력 저장 실패', error);
      throw error;
    }
  }

  /**
   * 세션의 검색 이력 조회
   */
  async getSessionHistory(sessionId: string): Promise<SearchHistory[]> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName.history,
          IndexName: 'SessionIndex',
          KeyConditionExpression: 'sessionId = :sessionId',
          ExpressionAttributeValues: {
            ':sessionId': sessionId,
          },
        })
      );

      return (result.Items as SearchHistory[]) || [];
    } catch (error) {
      logger.error('세션 이력 조회 실패', error);
      return [];
    }
  }

  /**
   * 분석 결과 캐시 저장
   */
  async saveAnalysisCache(
    productName: string,
    analysisResult: ProductAnalysisResult,
    ttlMinutes: number = 60
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(productName);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const cache: AnalysisCache = {
      cacheKey,
      productName,
      analysisResult,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName.cache,
          Item: cache,
        })
      );

      logger.info('분석 결과 캐시 저장됨', { cacheKey, productName });
    } catch (error) {
      logger.error('캐시 저장 실패', error);
      // 캐시 저장 실패는 치명적이지 않으므로 에러를 throw하지 않음
    }
  }

  /**
   * 캐시된 분석 결과 조회
   */
  async getAnalysisCache(productName: string): Promise<ProductAnalysisResult | null> {
    const cacheKey = this.generateCacheKey(productName);

    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: this.tableName.cache,
          Key: { cacheKey },
        })
      );

      if (!result.Item) {
        return null;
      }

      const cache = result.Item as AnalysisCache;

      // 만료 확인
      if (new Date(cache.expiresAt) < new Date()) {
        logger.info('캐시 만료됨', { cacheKey });
        return null;
      }

      // 히트 카운트 증가
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName.cache,
          Key: { cacheKey },
          UpdateExpression: 'SET hitCount = hitCount + :inc',
          ExpressionAttributeValues: {
            ':inc': 1,
          },
        })
      );

      logger.info('캐시 히트', { cacheKey, hitCount: cache.hitCount + 1 });
      return cache.analysisResult;
    } catch (error) {
      logger.error('캐시 조회 실패', error);
      return null;
    }
  }

  /**
   * 캐시 키 생성 (제품명을 정규화)
   */
  private generateCacheKey(productName: string): string {
    // 소문자 변환, 공백 제거, 특수문자 제거
    const normalized = productName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9가-힣]/g, '');

    return `product:${normalized}`;
  }
}

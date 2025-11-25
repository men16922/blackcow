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
    const endpoint = process.env.DYNAMODB_ENDPOINT;
    const region = process.env.AWS_REGION || 'ap-northeast-2';

    logger.info('DynamoDB Client 초기화', {
      endpoint: endpoint || '(AWS DynamoDB)',
      region,
    });

    const baseClient = new DynamoDBClient({
      region,
      ...(endpoint && { endpoint }), // endpoint가 있을 때만 설정
    });

    this.client = DynamoDBDocumentClient.from(baseClient);

    this.tableName = {
      sessions: process.env.DYNAMODB_TABLE_SESSIONS || 'BlackCow_SearchSessions',
      history: process.env.DYNAMODB_TABLE_HISTORY || 'BlackCow_SearchHistory',
      cache: process.env.DYNAMODB_TABLE_CACHE || 'BlackCow_AnalysisCache',
    };

    logger.info('DynamoDB 테이블 이름', this.tableName);
  }

  /**
   * 새 검색 세션 생성
   */
  async createSession(
    productName: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<SearchSession> {
    const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30일 후

    const session: SearchSession = {
      sessionId: uuidv4(),
      productName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userAgent,
      ipAddress,
      ttl,
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
    searchType: 'product' | 'price' | 'review' | 'risk',
    query: string,
    response: unknown,
    processingTime: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<SearchHistory> {
    const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90일 후

    const history: SearchHistory = {
      historyId: uuidv4(),
      sessionId,
      productName,
      searchType,
      query,
      response,
      processingTime,
      success,
      errorMessage,
      createdAt: new Date().toISOString(),
      ttl,
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
    ttlHours: number = 24
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(productName);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
    const ttl = Math.floor(expiresAt.getTime() / 1000);

    const cache: AnalysisCache = {
      cacheKey,
      productName,
      analysisResult,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
      lastAccessedAt: now.toISOString(),
      version: '1.0.0',
      ttl,
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

  /**
   * Generic: 테이블에서 아이템 조회
   */
  async getItem<T>(tableName: string, key: Record<string, unknown>): Promise<T | null> {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: tableName,
          Key: key,
        })
      );

      return (result.Item as T) || null;
    } catch (error) {
      logger.error('아이템 조회 실패', { tableName, key, error });
      return null;
    }
  }

  /**
   * Generic: 테이블에 아이템 저장
   */
  async putItem<T extends Record<string, unknown>>(
    tableName: string,
    item: T
  ): Promise<void> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );

      logger.info('아이템 저장 완료', { tableName });
    } catch (error) {
      logger.error('아이템 저장 실패', { tableName, error });
      throw error;
    }
  }

  /**
   * Generic: 테이블에서 아이템 업데이트 (UpdateExpression 사용)
   */
  async updateItem(
    tableName: string,
    key: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Promise<void> {
    try {
      // UpdateExpression 생성
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(updates).forEach(([field, value], index) => {
        const nameKey = `#field${index}`;
        const valueKey = `:value${index}`;

        expressionAttributeNames[nameKey] = field;
        expressionAttributeValues[valueKey] = value;
        updateExpressions.push(`${nameKey} = ${valueKey}`);
      });

      await this.client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: key,
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );

      logger.info('아이템 업데이트 완료', { tableName });
    } catch (error) {
      logger.error('아이템 업데이트 실패', { tableName, key, error });
      throw error;
    }
  }

  /**
   * Generic: 테이블에서 아이템 삭제
   */
  async deleteItem(tableName: string, key: Record<string, unknown>): Promise<void> {
    try {
      const DeleteCommand = (await import('@aws-sdk/lib-dynamodb')).DeleteCommand;

      await this.client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: key,
        })
      );

      logger.info('아이템 삭제 완료', { tableName });
    } catch (error) {
      logger.error('아이템 삭제 실패', { tableName, key, error });
      throw error;
    }
  }

  /**
   * Generic: 숫자 필드 증가 (원자적 연산)
   */
  async incrementField(
    tableName: string,
    key: Record<string, unknown>,
    field: string,
    incrementBy: number = 1
  ): Promise<void> {
    try {
      await this.client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: key,
          UpdateExpression: `SET ${field} = if_not_exists(${field}, :zero) + :inc`,
          ExpressionAttributeValues: {
            ':zero': 0,
            ':inc': incrementBy,
          },
        })
      );

      logger.debug('필드 증가 완료', { tableName, field, incrementBy });
    } catch (error) {
      logger.error('필드 증가 실패', { tableName, key, field, error });
      throw error;
    }
  }

  /**
   * Generic: 쿼리 실행 (GSI 사용)
   */
  async query<T>(
    tableName: string,
    options: {
      IndexName?: string;
      KeyConditionExpression: string;
      ExpressionAttributeValues: Record<string, unknown>;
      ExpressionAttributeNames?: Record<string, string>;
    }
  ): Promise<T[]> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: tableName,
          ...options,
        })
      );

      return (result.Items as T[]) || [];
    } catch (error) {
      logger.error('쿼리 실패', { tableName, error });
      return [];
    }
  }

  /**
   * Generic: 테이블 전체 스캔
   */
  async scan<T>(tableName: string): Promise<T[]> {
    try {
      const ScanCommand = (await import('@aws-sdk/lib-dynamodb')).ScanCommand;

      const result = await this.client.send(
        new ScanCommand({
          TableName: tableName,
        })
      );

      return (result.Items as T[]) || [];
    } catch (error) {
      logger.error('스캔 실패', { tableName, error });
      return [];
    }
  }
}

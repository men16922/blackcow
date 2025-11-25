/**
 * DynamoDB 스키마 및 데이터베이스 관련 타입
 */

import { ProductAnalysisResult, PerplexitySearchResponse } from './perplexity.js';

/**
 * 검색 세션 상태
 */
export type SessionStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

/**
 * 검색 타입
 */
export type SearchType = 'product' | 'price' | 'review' | 'risk';

/**
 * 검색 세션
 *
 * DynamoDB 키 스키마:
 * - PK: sessionId (Partition Key)
 * - SK: createdAt (Sort Key)
 *
 * GSI:
 * - ProductNameIndex: productName (PK), createdAt (SK)
 */
export interface SearchSession {
  // 기본 키
  sessionId: string; // PK: UUID v4
  createdAt: string; // SK: ISO 8601 timestamp

  // 세션 정보
  productName: string; // GSI PK
  productUrl?: string; // 원본 상품 URL
  status: SessionStatus;

  // 분석 결과
  analysisResult?: ProductAnalysisResult;
  errorMessage?: string; // 실패 시 에러 메시지

  // 메타데이터
  updatedAt: string; // ISO 8601 timestamp
  userAgent?: string;
  ipAddress?: string;
  userId?: string; // 향후 사용자 인증 추가 시

  // TTL (30일 후 자동 삭제)
  ttl?: number; // Unix timestamp (초 단위)
}

/**
 * 검색 이력
 *
 * DynamoDB 키 스키마:
 * - PK: historyId (Partition Key)
 * - SK: createdAt (Sort Key)
 *
 * GSI:
 * - SessionIndex: sessionId (PK), createdAt (SK)
 * - SearchTypeIndex: searchType (PK), createdAt (SK)
 */
export interface SearchHistory {
  // 기본 키
  historyId: string; // PK: UUID v4
  createdAt: string; // SK: ISO 8601 timestamp

  // 관계
  sessionId: string; // GSI PK (SessionIndex)

  // 검색 정보
  productName: string;
  searchType: SearchType; // GSI PK (SearchTypeIndex)
  query: string; // Perplexity에 전송한 쿼리

  // 응답 데이터
  response: PerplexitySearchResponse; // Perplexity 원본 응답
  processingTime: number; // 처리 시간 (ms)

  // 메타데이터
  success: boolean;
  errorMessage?: string;

  // TTL (90일 후 자동 삭제)
  ttl?: number; // Unix timestamp (초 단위)
}

/**
 * 분석 결과 캐시
 *
 * DynamoDB 키 스키마:
 * - PK: cacheKey (Partition Key)
 * - SK: productName (Sort Key)
 *
 * GSI:
 * - ExpiresAtIndex: expiresAt (PK) - 만료된 항목 정리용
 */
export interface AnalysisCache {
  // 기본 키
  cacheKey: string; // PK: hash(productName + version)
  productName: string; // SK

  // 캐시 데이터
  analysisResult: ProductAnalysisResult;

  // 캐시 메타데이터
  createdAt: string; // ISO 8601 timestamp
  expiresAt: string; // ISO 8601 timestamp (24시간 후)
  hitCount: number; // 캐시 히트 횟수
  lastAccessedAt: string; // ISO 8601 timestamp

  // 버전 관리
  version: string; // 분석 알고리즘 버전 (예: "1.0.0")

  // TTL (expiresAt 기준)
  ttl: number; // Unix timestamp (초 단위)
}

/**
 * DynamoDB 테이블 이름
 */
export const DynamoDBTableNames = {
  SEARCH_SESSIONS: 'SearchSessions',
  SEARCH_HISTORY: 'SearchHistory',
  ANALYSIS_CACHE: 'AnalysisCache',
} as const;

/**
 * DynamoDB GSI 이름
 */
export const DynamoDBIndexNames = {
  // SearchSessions 테이블
  PRODUCT_NAME_INDEX: 'ProductNameIndex',

  // SearchHistory 테이블
  SESSION_INDEX: 'SessionIndex',
  SEARCH_TYPE_INDEX: 'SearchTypeIndex',

  // AnalysisCache 테이블
  EXPIRES_AT_INDEX: 'ExpiresAtIndex',
} as const;

/**
 * DynamoDB 테이블 구조 매핑
 */
export interface DynamoDBTables {
  SearchSessions: SearchSession;
  SearchHistory: SearchHistory;
  AnalysisCache: AnalysisCache;
}

/**
 * 헬퍼 타입: 테이블 이름
 */
export type TableName = keyof DynamoDBTables;

/**
 * 헬퍼 타입: 테이블별 아이템 타입
 */
export type TableItem<T extends TableName> = DynamoDBTables[T];

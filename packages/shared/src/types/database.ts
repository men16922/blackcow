/**
 * DynamoDB 스키마 및 데이터베이스 관련 타입
 */

import { ProductAnalysisResult } from './perplexity.js';

// 검색 세션
export interface SearchSession {
  sessionId: string;
  productName: string;
  createdAt: string;
  updatedAt: string;
  analysisResult?: ProductAnalysisResult;
  userAgent?: string;
  ipAddress?: string;
}

// 검색 이력
export interface SearchHistory {
  historyId: string;
  sessionId: string;
  productName: string;
  searchType: 'product' | 'price' | 'review' | 'score';
  query: string;
  results: unknown; // Perplexity 원본 응답 저장
  createdAt: string;
}

// 분석 결과 캐시
export interface AnalysisCache {
  cacheKey: string;
  productName: string;
  analysisResult: ProductAnalysisResult;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
}

// DynamoDB 테이블 구조
export interface DynamoDBTables {
  SearchSessions: SearchSession;
  SearchHistory: SearchHistory;
  AnalysisCache: AnalysisCache;
}

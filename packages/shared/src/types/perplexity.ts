/**
 * Perplexity API 관련 타입 정의
 */

/**
 * 프롬프트 템플릿 타입
 */
export type PromptTemplateType = 'product' | 'price' | 'review' | 'risk';

/**
 * 프롬프트 변수
 */
export interface PromptVariables {
  productName: string;
  [key: string]: string | number | boolean;
}

/**
 * 프롬프트 템플릿
 */
export interface PromptTemplate {
  type: PromptTemplateType;
  template: string;
  description: string;
  variables: string[]; // 필요한 변수 목록
  example?: string; // 예시 프롬프트
}

// Perplexity API 요청
export interface PerplexitySearchRequest {
  query: string | string[];
  max_results?: number;
  search_domain_filter?: string[];
  max_tokens_per_page?: number;
  country?: string;
  search_recency_filter?: 'day' | 'week' | 'month' | 'year';
  search_after_date?: string; // MM/DD/YYYY
  search_before_date?: string; // MM/DD/YYYY
}

// Perplexity API 응답
export interface PerplexitySearchResponse {
  results: PerplexitySearchResult[];
}

export interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  last_updated?: string;
}

// 상품 요약 정보
export interface ProductSummary {
  productName: string;
  averagePrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  popularPlatforms: string[];
  description: string;
  keyFeatures: string[];
  searchedAt: string;
}

// 가격 비교 정보
export interface PriceComparison {
  productName: string;
  prices: PricePoint[];
  statistics: {
    average: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };
  outliers: PricePoint[];
}

export interface PricePoint {
  platform: string;
  price: number;
  url: string;
  seller?: string;
  lastUpdated?: string;
}

// 리뷰 요약
export interface ReviewDigest {
  productName: string;
  overallSentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  sentimentScore: number; // 0-100
  commonPraises: string[];
  commonComplaints: string[];
  keyInsights: string[];
  reviewCount?: number;
  averageRating?: number;
}

// 위험도 분석 결과
export interface RiskScore {
  score: number; // 0-100 (높을수록 위험)
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: RiskFactor[];
  recommendation: string;
}

export interface RiskFactor {
  category: 'PRICE' | 'SELLER' | 'REVIEW' | 'PLATFORM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  impact: number; // 0-100
}

// 통합 분석 결과 (새로운 API 응답 형식)
export interface ProductAnalysisResult {
  sessionId: string;
  productName: string;
  summary: ProductSummary;
  priceComparison?: PriceComparison;
  reviewDigest?: ReviewDigest;
  riskScore: RiskScore;
  analyzedAt: string;
  processingTime: number;
}

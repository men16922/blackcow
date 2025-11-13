/**
 * Perplexity API Adapter
 * Perplexity Search API를 호출하고 결과를 정규화합니다.
 */

import axios, { AxiosInstance } from 'axios';
import type {
  PerplexitySearchRequest,
  PerplexitySearchResponse,
  PerplexitySearchResult,
  ProductSummary,
  PriceComparison,
  ReviewDigest,
  PricePoint,
} from '@shopping-fraud-detector/shared';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export class PerplexityAdapter {
  private client: AxiosInstance;
  private model: string;

  constructor(apiKey: string, model: string = 'pplx-7b-online') {
    this.model = model;
    this.client = axios.create({
      baseURL: 'https://api.perplexity.ai',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30초 타임아웃
    });
  }

  /**
   * Perplexity Search API 호출
   */
  async search(request: PerplexitySearchRequest): Promise<PerplexitySearchResponse> {
    try {
      logger.info('Perplexity API 호출', { query: request.query });

      const response = await this.client.post<PerplexitySearchResponse>('/search', {
        model: this.model,
        ...request,
      });

      logger.info('Perplexity API 응답 수신', {
        resultCount: response.data.results?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Perplexity API 호출 실패', error);
      throw new Error(
        `Perplexity API 호출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    }
  }

  /**
   * 상품 요약 정보 검색
   */
  async getProductSummary(productName: string): Promise<ProductSummary> {
    const query = `${productName} 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요. 가격은 원화(KRW)로 표시해주세요.`;

    const response = await this.search({
      query,
      max_results: 10,
      country: 'KR',
      search_recency_filter: 'month',
    });

    return this.normalizeProductSummary(productName, response);
  }

  /**
   * 가격 비교 정보 검색
   */
  async getPriceComparison(productName: string): Promise<PriceComparison> {
    const query = `${productName} 가격 비교, 쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션 등 주요 쇼핑몰의 최저가 정보를 알려주세요. 가격은 원화(KRW)로 표시해주세요.`;

    const response = await this.search({
      query,
      max_results: 15,
      country: 'KR',
      search_recency_filter: 'week',
      search_domain_filter: [
        'coupang.com',
        'shopping.naver.com',
        '11st.co.kr',
        'gmarket.co.kr',
        'auction.co.kr',
      ],
    });

    return this.normalizePriceComparison(productName, response);
  }

  /**
   * 리뷰 요약 정보 검색
   */
  async getReviewDigest(productName: string): Promise<ReviewDigest> {
    const query = `${productName} 사용자 리뷰 요약, 장점과 단점, 구매 후기, 전반적인 평가를 한국어로 알려주세요.`;

    const response = await this.search({
      query,
      max_results: 10,
      country: 'KR',
      search_recency_filter: 'month',
    });

    return this.normalizeReviewDigest(productName, response);
  }

  /**
   * ProductSummary로 정규화
   */
  private normalizeProductSummary(
    productName: string,
    response: PerplexitySearchResponse
  ): ProductSummary {
    const results = response.results || [];

    // 플랫폼 추출 (URL에서)
    const platforms = new Set<string>();
    results.forEach((result: PerplexitySearchResult) => {
      const url = result.url.toLowerCase();
      if (url.includes('coupang')) platforms.add('쿠팡');
      else if (url.includes('naver')) platforms.add('네이버쇼핑');
      else if (url.includes('11st')) platforms.add('11번가');
      else if (url.includes('gmarket')) platforms.add('G마켓');
      else if (url.includes('auction')) platforms.add('옥션');
    });

    // 가격 정보 추출 시도
    const priceMatches: number[] = [];
    results.forEach((result: PerplexitySearchResult) => {
      const text = `${result.title} ${result.snippet}`;
      // 가격 패턴: 숫자 + 원, 숫자,숫자원 등
      const matches = text.match(/(\d{1,3}(,\d{3})*)\s*원/g);
      if (matches) {
        matches.forEach(match => {
          const price = parseInt(match.replace(/[,원]/g, ''));
          if (price > 1000 && price < 100000000) {
            // 1천원 ~ 1억원 사이
            priceMatches.push(price);
          }
        });
      }
    });

    let averagePrice: number | undefined;
    let priceRange: { min: number; max: number } | undefined;

    if (priceMatches.length > 0) {
      averagePrice = Math.round(
        priceMatches.reduce((a, b) => a + b, 0) / priceMatches.length
      );
      priceRange = {
        min: Math.min(...priceMatches),
        max: Math.max(...priceMatches),
      };
    }

    // 키 특징 추출 (첫 3개 결과의 snippet에서)
    const keyFeatures = results
      .slice(0, 3)
      .map((r: PerplexitySearchResult) => r.snippet)
      .filter((s: string) => s && s.length > 10)
      .slice(0, 5);

    // 설명 생성 (첫 번째 결과의 snippet)
    const description = results[0]?.snippet || `${productName}에 대한 정보입니다.`;

    return {
      productName,
      averagePrice,
      priceRange,
      popularPlatforms: Array.from(platforms),
      description,
      keyFeatures,
      searchedAt: new Date().toISOString(),
    };
  }

  /**
   * PriceComparison으로 정규화
   */
  private normalizePriceComparison(
    productName: string,
    response: PerplexitySearchResponse
  ): PriceComparison {
    const results = response.results || [];
    const prices: PricePoint[] = [];

    results.forEach((result: PerplexitySearchResult) => {
      const text = `${result.title} ${result.snippet}`;
      const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);

      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (price > 1000 && price < 100000000) {
          // 플랫폼 추출
          let platform = '기타';
          const url = result.url.toLowerCase();
          if (url.includes('coupang')) platform = '쿠팡';
          else if (url.includes('naver')) platform = '네이버쇼핑';
          else if (url.includes('11st')) platform = '11번가';
          else if (url.includes('gmarket')) platform = 'G마켓';
          else if (url.includes('auction')) platform = '옥션';

          prices.push({
            platform,
            price,
            url: result.url,
            lastUpdated: result.last_updated || result.date,
          });
        }
      }
    });

    // 통계 계산
    const priceValues = prices.map(p => p.price);
    const average = priceValues.length
      ? Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length)
      : 0;

    const sorted = [...priceValues].sort((a, b) => a - b);
    const median =
      sorted.length > 0
        ? sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

    const min = priceValues.length ? Math.min(...priceValues) : 0;
    const max = priceValues.length ? Math.max(...priceValues) : 0;

    // 표준편차 계산
    const variance =
      priceValues.length > 0
        ? priceValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
          priceValues.length
        : 0;
    const stdDev = Math.round(Math.sqrt(variance));

    // 이상치 탐지 (평균 ± 2*표준편차 밖)
    const outliers = prices.filter(p => {
      return Math.abs(p.price - average) > 2 * stdDev;
    });

    return {
      productName,
      prices: prices.sort((a, b) => a.price - b.price), // 가격 오름차순 정렬
      statistics: {
        average,
        median,
        min,
        max,
        stdDev,
      },
      outliers,
    };
  }

  /**
   * ReviewDigest로 정규화
   */
  private normalizeReviewDigest(
    productName: string,
    response: PerplexitySearchResponse
  ): ReviewDigest {
    const results = response.results || [];

    // 긍정/부정 키워드 분석
    const positiveKeywords = [
      '좋아요',
      '만족',
      '추천',
      '훌륭',
      '최고',
      '가성비',
      '품질',
      '편리',
      '빠른',
    ];
    const negativeKeywords = [
      '실망',
      '불만',
      '최악',
      '별로',
      '불편',
      '느림',
      '비싸',
      '고장',
      '환불',
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    const allText = results
      .map((r: PerplexitySearchResult) => `${r.title} ${r.snippet}`)
      .join(' ');

    positiveKeywords.forEach(keyword => {
      const matches = allText.match(new RegExp(keyword, 'g'));
      if (matches) positiveCount += matches.length;
    });

    negativeKeywords.forEach(keyword => {
      const matches = allText.match(new RegExp(keyword, 'g'));
      if (matches) negativeCount += matches.length;
    });

    // 감정 점수 및 전반적인 감정 계산
    const total = positiveCount + negativeCount;
    const sentimentScore =
      total > 0 ? Math.round((positiveCount / total) * 100) : 50;

    let overallSentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
    if (sentimentScore >= 70) overallSentiment = 'positive';
    else if (sentimentScore <= 30) overallSentiment = 'negative';
    else if (Math.abs(positiveCount - negativeCount) < 3) overallSentiment = 'neutral';
    else overallSentiment = 'mixed';

    // 공통 칭찬/불만 추출 (간단한 패턴 매칭)
    const commonPraises: string[] = [];
    const commonComplaints: string[] = [];

    results.slice(0, 5).forEach((result: PerplexitySearchResult) => {
      const snippet = result.snippet;
      positiveKeywords.forEach(keyword => {
        if (snippet.includes(keyword)) {
          const sentence = snippet.split('.').find((s: string) => s.includes(keyword));
          if (sentence && sentence.length < 100) {
            commonPraises.push(sentence.trim());
          }
        }
      });

      negativeKeywords.forEach(keyword => {
        if (snippet.includes(keyword)) {
          const sentence = snippet.split('.').find((s: string) => s.includes(keyword));
          if (sentence && sentence.length < 100) {
            commonComplaints.push(sentence.trim());
          }
        }
      });
    });

    // 주요 인사이트 (첫 3개 결과 요약)
    const keyInsights = results
      .slice(0, 3)
      .map((r: PerplexitySearchResult) => r.snippet)
      .filter((s: string) => s && s.length > 20)
      .slice(0, 3);

    return {
      productName,
      overallSentiment,
      sentimentScore,
      commonPraises: [...new Set(commonPraises)].slice(0, 5),
      commonComplaints: [...new Set(commonComplaints)].slice(0, 5),
      keyInsights,
    };
  }
}

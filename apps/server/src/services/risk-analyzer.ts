/**
 * Risk Analyzer
 * Perplexity 분석 결과를 기반으로 위험도 점수를 계산합니다.
 */

import type {
  ProductSummary,
  PriceComparison,
  ReviewDigest,
  RiskScore,
  RiskFactor,
} from '@shopping-fraud-detector/shared';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export class RiskAnalyzer {
  /**
   * 위험도 점수 계산
   * @param summary 상품 요약
   * @param priceComparison 가격 비교 (선택)
   * @param reviewDigest 리뷰 요약 (선택)
   * @returns RiskScore
   */
  calculateRiskScore(
    summary: ProductSummary,
    priceComparison?: PriceComparison,
    reviewDigest?: ReviewDigest
  ): RiskScore {
    const factors: RiskFactor[] = [];
    let totalRisk = 0;
    let factorCount = 0;

    // 1. 가격 위험도 분석 (40% 가중치)
    if (priceComparison) {
      const priceFactor = this.analyzePriceRisk(priceComparison);
      factors.push(priceFactor);
      totalRisk += priceFactor.impact * 0.4;
      factorCount++;
    }

    // 2. 플랫폼 위험도 분석 (20% 가중치)
    const platformFactor = this.analyzePlatformRisk(summary);
    factors.push(platformFactor);
    totalRisk += platformFactor.impact * 0.2;
    factorCount++;

    // 3. 리뷰 위험도 분석 (40% 가중치)
    if (reviewDigest) {
      const reviewFactor = this.analyzeReviewRisk(reviewDigest);
      factors.push(reviewFactor);
      totalRisk += reviewFactor.impact * 0.4;
      factorCount++;
    }

    // 최종 위험도 점수 계산 (0-100)
    const finalScore = Math.round(totalRisk);

    // 위험도 레벨 결정
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    if (finalScore < 30) level = 'LOW';
    else if (finalScore < 60) level = 'MEDIUM';
    else level = 'HIGH';

    // 추천 메시지 생성
    const recommendation = this.generateRecommendation(finalScore, factors);

    logger.info('위험도 분석 완료', {
      score: finalScore,
      level,
      factorCount,
    });

    return {
      score: finalScore,
      level,
      factors,
      recommendation,
    };
  }

  /**
   * 가격 위험도 분석
   */
  private analyzePriceRisk(priceComparison: PriceComparison): RiskFactor {
    const { statistics, outliers, prices } = priceComparison;

    // 1. 가격 변동성 체크 (표준편차 / 평균)
    const variationCoef =
      statistics.average > 0 ? statistics.stdDev / statistics.average : 0;

    // 2. 이상치 비율
    const outlierRatio = prices.length > 0 ? outliers.length / prices.length : 0;

    // 3. 가격 범위
    const priceRange = statistics.max - statistics.min;
    const rangeRatio = statistics.average > 0 ? priceRange / statistics.average : 0;

    // 위험도 계산
    let impact = 0;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let description = '가격이 안정적입니다.';

    if (variationCoef > 0.5 || outlierRatio > 0.3 || rangeRatio > 1.5) {
      impact = 80;
      severity = 'HIGH';
      description =
        '가격 변동이 매우 심합니다. 비정상적으로 높거나 낮은 가격이 있을 수 있습니다.';
    } else if (variationCoef > 0.3 || outlierRatio > 0.15 || rangeRatio > 0.8) {
      impact = 50;
      severity = 'MEDIUM';
      description = '가격 변동이 다소 있습니다. 주의 깊게 비교해보세요.';
    } else {
      impact = 20;
      severity = 'LOW';
      description = '가격이 안정적입니다.';
    }

    // 가격 데이터가 부족한 경우
    if (prices.length < 3) {
      impact = Math.max(impact, 40);
      severity = 'MEDIUM';
      description = '가격 정보가 부족합니다. 추가 조사가 필요합니다.';
    }

    return {
      category: 'PRICE',
      severity,
      description,
      impact,
    };
  }

  /**
   * 플랫폼 위험도 분석
   */
  private analyzePlatformRisk(summary: ProductSummary): RiskFactor {
    const { popularPlatforms } = summary;

    // 신뢰할 수 있는 플랫폼 목록
    const trustedPlatforms = [
      '쿠팡',
      '네이버쇼핑',
      '11번가',
      'G마켓',
      '옥션',
      '티몬',
      '위메프',
    ];

    // 신뢰 플랫폼에서 판매 중인지 확인
    const trustedCount = popularPlatforms.filter((p: string) =>
      trustedPlatforms.some((tp: string) => p.includes(tp))
    ).length;

    const trustedRatio =
      popularPlatforms.length > 0 ? trustedCount / popularPlatforms.length : 0;

    let impact = 0;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let description = '';

    if (trustedRatio >= 0.8 && popularPlatforms.length >= 2) {
      impact = 10;
      severity = 'LOW';
      description = '신뢰할 수 있는 플랫폼에서 판매 중입니다.';
    } else if (trustedRatio >= 0.5) {
      impact = 30;
      severity = 'LOW';
      description = '일부 신뢰 플랫폼에서 판매 중입니다.';
    } else if (popularPlatforms.length > 0) {
      impact = 60;
      severity = 'MEDIUM';
      description = '알려지지 않은 플랫폼에서 주로 판매됩니다. 주의가 필요합니다.';
    } else {
      impact = 80;
      severity = 'HIGH';
      description = '판매 플랫폼 정보를 찾을 수 없습니다. 신중하게 검토하세요.';
    }

    return {
      category: 'PLATFORM',
      severity,
      description,
      impact,
    };
  }

  /**
   * 리뷰 위험도 분석
   */
  private analyzeReviewRisk(reviewDigest: ReviewDigest): RiskFactor {
    const { overallSentiment, sentimentScore, commonComplaints } = reviewDigest;

    let impact = 0;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let description = '';

    // 1. 전반적인 감정 분석
    if (overallSentiment === 'positive' && sentimentScore >= 70) {
      impact = 10;
      severity = 'LOW';
      description = '사용자 리뷰가 대체로 긍정적입니다.';
    } else if (overallSentiment === 'negative' && sentimentScore <= 30) {
      impact = 80;
      severity = 'HIGH';
      description = '사용자 리뷰가 부정적입니다. 구매를 재고하세요.';
    } else if (overallSentiment === 'mixed') {
      impact = 50;
      severity = 'MEDIUM';
      description = '긍정과 부정 리뷰가 혼재되어 있습니다. 신중하게 판단하세요.';
    } else {
      impact = 40;
      severity = 'MEDIUM';
      description = '리뷰 정보가 충분하지 않거나 중립적입니다.';
    }

    // 2. 불만 사항 개수
    if (commonComplaints.length >= 5) {
      impact = Math.max(impact, 70);
      severity = 'HIGH';
    } else if (commonComplaints.length >= 3) {
      impact = Math.max(impact, 50);
      if (severity === 'LOW') severity = 'MEDIUM';
    }

    // 3. 특정 위험 키워드 체크
    const dangerKeywords = ['사기', '가짜', '환불', '불량', '고장', '최악'];
    const hasDangerKeyword = commonComplaints.some((complaint: string) =>
      dangerKeywords.some((keyword: string) => complaint.includes(keyword))
    );

    if (hasDangerKeyword) {
      impact = Math.max(impact, 85);
      severity = 'HIGH';
      description = '심각한 문제가 보고되었습니다. 구매 전 충분히 검토하세요.';
    }

    return {
      category: 'REVIEW',
      severity,
      description,
      impact,
    };
  }

  /**
   * 추천 메시지 생성
   */
  private generateRecommendation(score: number, factors: RiskFactor[]): string {
    if (score < 30) {
      return '✅ 안전한 제품으로 보입니다. 자신있게 구매하세요!';
    } else if (score < 60) {
      const concerns = factors
        .filter(f => f.severity !== 'LOW')
        .map(f => f.category)
        .join(', ');
      return `⚠️ 보통 수준의 위험도입니다. ${concerns} 항목을 주의깊게 확인하세요.`;
    } else {
      const highRisks = factors.filter(f => f.severity === 'HIGH');
      if (highRisks.length > 0) {
        return `🚨 높은 위험도입니다! ${highRisks.map(f => f.description).join(' ')} 구매를 신중히 재고하세요.`;
      }
      return '🚨 높은 위험도입니다. 구매 전 충분한 조사를 권장합니다.';
    }
  }
}

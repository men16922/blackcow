# Backend Flow 설계 문서

## 개요

쇼핑 흑우 감별사의 백엔드 시스템 아키텍처, API 엔드포인트, 데이터 흐름을 정의합니다.

## 시스템 아키텍처

```
┌─────────────────┐
│  React Client   │
│   (Port 3001)   │
└────────┬────────┘
         │ HTTP/HTTPS
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
│                    (Port 3000)                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Middleware Layer                     │  │
│  │  - CORS                                          │  │
│  │  - Helmet (Security)                             │  │
│  │  - Rate Limiting                                 │  │
│  │  - Body Parser                                   │  │
│  │  - Logger                                        │  │
│  │  - Error Handler                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ▼                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Route Layer                          │  │
│  │  - POST /api/analyze                             │  │
│  │  - GET /api/alternatives                         │  │
│  │  - GET /api/session/:id                          │  │
│  │  - GET /api/health                               │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ▼                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Service Layer                        │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  ProductAnalysisService                     │ │  │
│  │  │  - analyzeProduct()                         │ │  │
│  │  │  - getAnalysisResult()                      │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  PerplexityAdapter                          │ │  │
│  │  │  - getProductSummary()                      │ │  │
│  │  │  - getPriceComparison()                     │ │  │
│  │  │  - getReviewDigest()                        │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  RiskAnalyzer                               │ │  │
│  │  │  - calculateBRS()                           │ │  │
│  │  │  - detectAnomalies()                        │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  CacheService                               │ │  │
│  │  │  - get()                                    │ │  │
│  │  │  - set()                                    │ │  │
│  │  │  - invalidate()                             │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                │
│                        ▼                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Data Layer                           │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  DynamoDB Client                            │ │  │
│  │  │  - putItem()                                │ │  │
│  │  │  - getItem()                                │ │  │
│  │  │  - query()                                  │ │  │
│  │  │  - updateItem()                             │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└───────────┬──────────────────────────────┬──────────────┘
            │                              │
            ▼                              ▼
  ┌──────────────────┐          ┌──────────────────┐
  │ Perplexity API   │          │  AWS DynamoDB    │
  │ (Search)         │          │  - Sessions      │
  │                  │          │  - History       │
  └──────────────────┘          │  - Cache         │
                                └──────────────────┘
```

---

## API 엔드포인트

### 1. POST /api/analyze

제품 분석을 수행하고 BRS(Black Cow Risk Score)를 반환합니다.

#### Request

```http
POST /api/analyze
Content-Type: application/json

{
  "productName": "삼성 갤럭시 버즈2 프로",
  "productUrl": "https://www.coupang.com/vp/products/123456" // optional
}
```

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "삼성 갤럭시 버즈2 프로",
    "summary": {
      "productName": "삼성 갤럭시 버즈2 프로",
      "averagePrice": 189000,
      "priceRange": { "min": 169000, "max": 229000 },
      "popularPlatforms": ["쿠팡", "네이버쇼핑", "11번가"],
      "description": "삼성전자의 프리미엄 완전 무선 이어폰...",
      "keyFeatures": ["지능형 ANC", "360 오디오", "IPX7 방수"],
      "searchedAt": "2025-11-22T10:30:00.000Z"
    },
    "priceComparison": {
      "productName": "삼성 갤럭시 버즈2 프로",
      "prices": [
        /* ... */
      ],
      "statistics": {
        "average": 190380,
        "median": 185000,
        "min": 169000,
        "max": 229000,
        "stdDev": 22145
      },
      "outliers": [
        /* ... */
      ]
    },
    "reviewDigest": {
      "productName": "삼성 갤럭시 버즈2 프로",
      "overallSentiment": "positive",
      "sentimentScore": 78,
      "commonPraises": [
        /* ... */
      ],
      "commonComplaints": [
        /* ... */
      ],
      "keyInsights": [
        /* ... */
      ]
    },
    "riskScore": {
      "score": 25,
      "level": "LOW",
      "factors": [
        /* ... */
      ],
      "recommendation": "안전한 구매로 판단됩니다."
    },
    "analyzedAt": "2025-11-22T10:30:15.000Z",
    "processingTime": 8500
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "제품 분석 중 오류가 발생했습니다.",
  "code": "ANALYSIS_FAILED",
  "details": {
    "message": "Perplexity API 호출 실패",
    "statusCode": 500
  }
}
```

---

### 2. GET /api/alternatives

대안 상품 목록을 조회합니다.

#### Request

```http
GET /api/alternatives?productName=삼성%20갤럭시%20버즈2%20프로
```

#### Query Parameters

| 파라미터    | 타입   | 필수 | 설명          |
| ----------- | ------ | ---- | ------------- |
| productName | string | ✅   | 검색할 제품명 |

#### Response

```json
{
  "success": true,
  "data": {
    "alternatives": [
      {
        "productName": "애플 에어팟 프로 2세대",
        "averagePrice": 329000,
        "platforms": ["쿠팡", "네이버쇼핑"],
        "riskScore": { "score": 15, "level": "LOW" }
      },
      {
        "productName": "소니 WF-1000XM5",
        "averagePrice": 299000,
        "platforms": ["쿠팡", "11번가"],
        "riskScore": { "score": 20, "level": "LOW" }
      }
    ]
  }
}
```

---

### 3. GET /api/session/:sessionId

특정 세션의 분석 결과를 조회합니다.

#### Request

```http
GET /api/session/550e8400-e29b-41d4-a716-446655440000
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "삼성 갤럭시 버즈2 프로",
    "status": "completed",
    "analysisResult": {
      /* ... */
    },
    "createdAt": "2025-11-22T10:30:00.000Z",
    "updatedAt": "2025-11-22T10:30:15.000Z"
  }
}
```

---

### 4. GET /api/health

서버 헬스체크 엔드포인트입니다.

#### Request

```http
GET /api/health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "services": {
    "database": "connected",
    "perplexity": "available"
  }
}
```

---

## 데이터 흐름 (Sequence Diagram)

### 제품 분석 플로우

```
Client                Server              PerplexityAdapter    RiskAnalyzer    DynamoDB
  |                     |                        |                  |            |
  |--POST /analyze----->|                        |                  |            |
  |                     |                        |                  |            |
  |                     |--createSession()------>|                  |            |
  |                     |                        |                  |---put----->|
  |                     |<--sessionId------------|                  |            |
  |                     |                        |                  |            |
  |                     |--checkCache()--------->|                  |            |
  |                     |                        |                  |---get----->|
  |                     |<--cache miss-----------|                  |            |
  |                     |                        |                  |            |
  |                     |--getProductSummary()-->|                  |            |
  |                     |                        |--Perplexity API->|            |
  |                     |<--ProductSummary-------|                  |            |
  |                     |                        |                  |---put----->|
  |                     |                        |                  |   (History)|
  |                     |                        |                  |            |
  |                     |--getPriceComparison()->|                  |            |
  |                     |                        |--Perplexity API->|            |
  |                     |<--PriceComparison------|                  |            |
  |                     |                        |                  |---put----->|
  |                     |                        |                  |   (History)|
  |                     |                        |                  |            |
  |                     |--getReviewDigest()---->|                  |            |
  |                     |                        |--Perplexity API->|            |
  |                     |<--ReviewDigest---------|                  |            |
  |                     |                        |                  |---put----->|
  |                     |                        |                  |   (History)|
  |                     |                        |                  |            |
  |                     |--calculateBRS()--------|----------------->|            |
  |                     |<--RiskScore------------|------------------|            |
  |                     |                        |                  |            |
  |                     |--updateSession()-------|------------------|----------->|
  |                     |                        |                  |   (update) |
  |                     |                        |                  |            |
  |                     |--setCache()----------->|                  |            |
  |                     |                        |                  |---put----->|
  |                     |                        |                  |   (Cache)  |
  |                     |                        |                  |            |
  |<--AnalysisResult----|                        |                  |            |
  |                     |                        |                  |            |
```

### 캐시 히트 플로우

```
Client                Server              CacheService         DynamoDB
  |                     |                        |                  |
  |--POST /analyze----->|                        |                  |
  |                     |                        |                  |
  |                     |--createSession()------>|                  |
  |                     |                        |                  |
  |                     |--checkCache()--------->|                  |
  |                     |                        |---get----------->|
  |                     |<--cache hit------------|<-AnalysisResult--|
  |                     |                        |                  |
  |                     |--updateHitCount()----->|                  |
  |                     |                        |---update-------->|
  |                     |                        |                  |
  |                     |--updateSession()------>|                  |
  |                     |                        |---update-------->|
  |                     |                        |                  |
  |<--AnalysisResult----|                        |                  |
  |   (instant)         |                        |                  |
```

---

## 서비스 레이어 상세

### ProductAnalysisService

제품 분석의 전체 흐름을 조율하는 메인 서비스입니다.

#### 주요 메서드

```typescript
class ProductAnalysisService {
  constructor(
    private perplexityAdapter: PerplexityAdapter,
    private riskAnalyzer: RiskAnalyzer,
    private cacheService: CacheService,
    private dbClient: DynamoDBClient
  ) {}

  /**
   * 제품 분석 수행
   */
  async analyzeProduct(productName: string, productUrl?: string): Promise<ProductAnalysisResult> {
    // 1. 세션 생성
    const session = await this.createSession(productName, productUrl);

    try {
      // 2. 캐시 확인
      const cached = await this.cacheService.get(productName);
      if (cached) {
        await this.updateSessionWithCache(session.sessionId, cached);
        return cached;
      }

      // 3. 데이터 수집 (병렬 실행)
      const [summary, priceComparison, reviewDigest] = await Promise.all([
        this.perplexityAdapter.getProductSummary(productName),
        this.perplexityAdapter.getPriceComparison(productName),
        this.perplexityAdapter.getReviewDigest(productName),
      ]);

      // 4. 위험도 분석
      const riskScore = await this.riskAnalyzer.calculateBRS({
        summary,
        priceComparison,
        reviewDigest,
      });

      // 5. 결과 생성
      const result: ProductAnalysisResult = {
        sessionId: session.sessionId,
        productName,
        summary,
        priceComparison,
        reviewDigest,
        riskScore,
        analyzedAt: new Date().toISOString(),
        processingTime: Date.now() - session.createdAtMs,
      };

      // 6. 세션 업데이트 및 캐시 저장
      await Promise.all([
        this.updateSession(session.sessionId, result),
        this.cacheService.set(productName, result),
      ]);

      return result;
    } catch (error) {
      // 에러 처리
      await this.failSession(session.sessionId, error);
      throw error;
    }
  }

  /**
   * 세션 생성
   */
  private async createSession(productName: string, productUrl?: string): Promise<SearchSession> {
    const session: SearchSession = {
      sessionId: generateUUID(),
      createdAt: new Date().toISOString(),
      productName,
      productUrl,
      status: 'pending',
      updatedAt: new Date().toISOString(),
      ttl: calculateTTL(30), // 30일
    };

    await this.dbClient.putItem('SearchSessions', session);
    return session;
  }

  /**
   * 세션 업데이트 (완료)
   */
  private async updateSession(sessionId: string, result: ProductAnalysisResult): Promise<void> {
    await this.dbClient.updateItem('SearchSessions', sessionId, {
      status: 'completed',
      analysisResult: result,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 세션 업데이트 (실패)
   */
  private async failSession(sessionId: string, error: Error): Promise<void> {
    await this.dbClient.updateItem('SearchSessions', sessionId, {
      status: 'failed',
      errorMessage: error.message,
      updatedAt: new Date().toISOString(),
    });
  }
}
```

---

### RiskAnalyzer

가격, 판매자, 리뷰를 분석하여 BRS 점수를 계산합니다.

#### BRS 계산 로직

```typescript
class RiskAnalyzer {
  /**
   * BRS (Black Cow Risk Score) 계산
   * 점수가 높을수록 위험
   */
  calculateBRS(data: {
    summary: ProductSummary;
    priceComparison: PriceComparison;
    reviewDigest: ReviewDigest;
  }): RiskScore {
    const factors: RiskFactor[] = [];

    // 1. 가격 분석 (40% 가중치)
    const priceFactor = this.analyzePriceRisk(data.priceComparison);
    factors.push(priceFactor);

    // 2. 판매자 분석 (30% 가중치)
    const sellerFactor = this.analyzeSellerRisk(data.summary);
    factors.push(sellerFactor);

    // 3. 리뷰 분석 (30% 가중치)
    const reviewFactor = this.analyzeReviewRisk(data.reviewDigest);
    factors.push(reviewFactor);

    // 4. 플랫폼 분석
    const platformFactor = this.analyzePlatformRisk(data.summary);
    factors.push(platformFactor);

    // 5. 종합 점수 계산 (가중 평균)
    const score = Math.round(
      priceFactor.impact * 0.4 + sellerFactor.impact * 0.3 + reviewFactor.impact * 0.3
    );

    // 6. 위험 수준 분류
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    if (score < 30) level = 'LOW';
    else if (score < 60) level = 'MEDIUM';
    else level = 'HIGH';

    // 7. 추천 메시지 생성
    const recommendation = this.generateRecommendation(level, factors);

    return { score, level, factors, recommendation };
  }

  /**
   * 가격 위험도 분석
   */
  private analyzePriceRisk(priceComparison: PriceComparison): RiskFactor {
    const { statistics, outliers } = priceComparison;

    // 이상치 비율 계산
    const outlierRatio = outliers.length / priceComparison.prices.length;

    // 변동성 계산 (변동계수 = 표준편차 / 평균)
    const coefficientOfVariation = statistics.stdDev / statistics.average;

    let severity: 'LOW' | 'MEDIUM' | 'HIGH';
    let impact: number;
    let description: string;

    if (outlierRatio > 0.3 || coefficientOfVariation > 0.5) {
      severity = 'HIGH';
      impact = 80;
      description = '가격 변동이 매우 크고 이상치가 많음. 주의 필요';
    } else if (outlierRatio > 0.1 || coefficientOfVariation > 0.3) {
      severity = 'MEDIUM';
      impact = 50;
      description = '가격 변동이 다소 있음. 비교 후 구매 권장';
    } else {
      severity = 'LOW';
      impact = 20;
      description = '가격이 안정적이고 정상 범위 내에 있음';
    }

    return { category: 'PRICE', severity, description, impact };
  }

  /**
   * 판매자 위험도 분석
   */
  private analyzeSellerRisk(summary: ProductSummary): RiskFactor {
    const { popularPlatforms } = summary;

    // 신뢰도 높은 플랫폼 목록
    const trustedPlatforms = ['쿠팡', '네이버쇼핑', '11번가', 'G마켓'];

    const trustedCount = popularPlatforms.filter(p => trustedPlatforms.includes(p)).length;

    let severity: 'LOW' | 'MEDIUM' | 'HIGH';
    let impact: number;
    let description: string;

    if (trustedCount >= 2) {
      severity = 'LOW';
      impact = 10;
      description = '신뢰도 높은 대형 쇼핑몰에서 판매 중';
    } else if (trustedCount === 1) {
      severity = 'MEDIUM';
      impact = 40;
      description = '일부 신뢰 플랫폼에서만 판매';
    } else {
      severity = 'HIGH';
      impact = 80;
      description = '주요 쇼핑몰에서 판매 확인 안 됨. 주의 필요';
    }

    return { category: 'SELLER', severity, description, impact };
  }

  /**
   * 리뷰 위험도 분석
   */
  private analyzeReviewRisk(reviewDigest: ReviewDigest): RiskFactor {
    const { sentimentScore, overallSentiment } = reviewDigest;

    let severity: 'LOW' | 'MEDIUM' | 'HIGH';
    let impact: number;
    let description: string;

    if (sentimentScore >= 70 && overallSentiment === 'positive') {
      severity = 'LOW';
      impact = 15;
      description = '전반적으로 긍정적인 리뷰';
    } else if (sentimentScore >= 50) {
      severity = 'MEDIUM';
      impact = 45;
      description = '리뷰가 혼재되어 있음. 상세 확인 권장';
    } else {
      severity = 'HIGH';
      impact = 75;
      description = '부정적 리뷰가 많음. 신중한 구매 필요';
    }

    return { category: 'REVIEW', severity, description, impact };
  }

  /**
   * 플랫폼 위험도 분석
   */
  private analyzePlatformRisk(summary: ProductSummary): RiskFactor {
    return {
      category: 'PLATFORM',
      severity: 'LOW',
      description: '대형 쇼핑몰로 구매자 보호 정책 완비',
      impact: 0,
    };
  }

  /**
   * 추천 메시지 생성
   */
  private generateRecommendation(level: 'LOW' | 'MEDIUM' | 'HIGH', factors: RiskFactor[]): string {
    if (level === 'LOW') {
      return '안전한 구매로 판단됩니다. 공식 판매처 또는 신뢰도 높은 판매자를 통해 구매하시면 됩니다.';
    } else if (level === 'MEDIUM') {
      const warnings = factors.filter(f => f.severity !== 'LOW').map(f => f.description);
      return `주의가 필요합니다. ${warnings.join(', ')}. 여러 플랫폼을 비교한 후 구매를 결정하세요.`;
    } else {
      return '높은 위험도가 감지되었습니다. 구매를 재고하시거나, 신뢰할 수 있는 판매처를 통해 구매하시기 바랍니다.';
    }
  }
}
```

---

### CacheService

분석 결과를 캐싱하여 반복 분석을 방지합니다.

```typescript
class CacheService {
  constructor(private dbClient: DynamoDBClient) {}

  /**
   * 캐시 조회
   */
  async get(productName: string): Promise<ProductAnalysisResult | null> {
    const cacheKey = this.generateCacheKey(productName);

    const item = await this.dbClient.getItem('AnalysisCache', {
      cacheKey,
      productName,
    });

    if (!item) return null;

    // 만료 확인
    if (new Date(item.expiresAt) < new Date()) {
      await this.invalidate(cacheKey);
      return null;
    }

    // 히트 카운트 업데이트
    await this.updateHitCount(cacheKey);

    return item.analysisResult;
  }

  /**
   * 캐시 저장
   */
  async set(productName: string, result: ProductAnalysisResult): Promise<void> {
    const cacheKey = this.generateCacheKey(productName);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간

    const cacheItem: AnalysisCache = {
      cacheKey,
      productName,
      analysisResult: result,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
      lastAccessedAt: now.toISOString(),
      version: '1.0.0',
      ttl: Math.floor(expiresAt.getTime() / 1000),
    };

    await this.dbClient.putItem('AnalysisCache', cacheItem);
  }

  /**
   * 캐시 무효화
   */
  async invalidate(cacheKey: string): Promise<void> {
    await this.dbClient.deleteItem('AnalysisCache', cacheKey);
  }

  /**
   * 히트 카운트 업데이트
   */
  private async updateHitCount(cacheKey: string): Promise<void> {
    await this.dbClient.updateItem('AnalysisCache', cacheKey, {
      hitCount: { $increment: 1 },
      lastAccessedAt: new Date().toISOString(),
    });
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(productName: string): string {
    const data = `${productName.toLowerCase().trim()}:1.0.0`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
  }
}
```

---

## 에러 처리 전략

### 에러 타입

```typescript
// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class PerplexityError extends ApiError {
  constructor(message: string) {
    super(502, message, 'PERPLEXITY_ERROR');
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string) {
    super(500, message, 'DATABASE_ERROR');
  }
}
```

### 전역 에러 핸들러

```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // 예상치 못한 에러
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
    code: 'INTERNAL_ERROR',
  });
};
```

---

## 성능 최적화

### 1. 병렬 처리

```typescript
// Perplexity API 호출을 병렬로 실행
const [summary, priceComparison, reviewDigest] = await Promise.all([
  this.perplexityAdapter.getProductSummary(productName),
  this.perplexityAdapter.getPriceComparison(productName),
  this.perplexityAdapter.getReviewDigest(productName),
]);
```

### 2. 캐싱

- 분석 결과를 24시간 캐싱
- 캐시 히트 시 Perplexity API 호출 생략
- 약 95% 비용 절감 효과

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
});

app.use('/api/', limiter);
```

---

## 로깅

### Winston Logger 설정

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

---

## 보안

### 1. Helmet.js

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
```

### 2. CORS

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
};

app.use(cors(corsOptions));
```

### 3. 환경 변수 검증

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  PERPLEXITY_API_KEY: z.string().min(1),
  DYNAMODB_ENDPOINT: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

---

## 향후 개선 사항

### 1. 큐 시스템 도입

- AWS SQS를 이용한 비동기 처리
- 대량 분석 요청 처리

### 2. WebSocket 지원

- 실시간 분석 진행 상황 전송
- Server-Sent Events (SSE) 사용

### 3. 배치 작업

- 주기적인 인기 제품 분석
- 캐시 정리 작업
- 통계 데이터 집계

### 4. 모니터링

- CloudWatch 메트릭 전송
- 알람 설정 (에러율, 응답 시간)

---

## 참고 자료

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling/)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

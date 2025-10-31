# 설계 문서

## 개요

쇼핑 흑우 감별사는 온라인 쇼핑몰 상품 링크를 분석하여 사기 위험도 점수(BRS, Blacksheep Risk Score)를 제공하는 AI 기반 사기 탐지 서비스입니다. Node.js + Express + DynamoDB 기반의 단일 서버 웹 애플리케이션으로 구현되며, AWS Bedrock Claude Sonnet 4.0을 활용한 리뷰 감정 분석을 핵심 기능으로 합니다.

## 아키텍처

![아키텍처 다이어그램](architecture_updated.png)

**배포 구성**:
- **AWS Lightsail** ($5/월): Nginx + Node.js + Express + PM2
- **AWS DynamoDB** (무료 티어): 데이터 저장 및 캐싱
- **AI 프로바이더** (선택 가능):
  - **AWS Bedrock**: Claude Sonnet 4.0 (프로덕션)
  - **Claude API**: API Key 기반 (로컬 개발)
  - **Ollama**: Qwen 2.5 / GPT-OSS (로컬 무료)

## 기술 스택

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express 4.x
- **Database**: AWS DynamoDB (AWS SDK v3)
- **Crawler**: Cheerio, Axios
- **AI/NLP**: AWS Bedrock Claude Sonnet 4.0
- **Logging**: Winston
- **Validation**: Joi
- **Security**: Helmet, express-rate-limit
- **Process Manager**: PM2

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Chart.js (Phase 2)
- **PDF Generation**: jsPDF (Phase 3)

### DevOps
- **Testing**: Jest, Supertest
- **Linting**: ESLint
- **Reverse Proxy**: Nginx
- **Deployment**: AWS Lightsail

## 프로젝트 구조

```
shopping-fraud-detector/
├── client/                      # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisCard.jsx        # 분석 결과 카드
│   │   │   ├── RiskBadge.jsx           # 위험도 배지
│   │   │   ├── RecommendationList.jsx  # 대안 상품 목록
│   │   │   ├── SentimentChart.jsx      # 감정 분석 차트 (Phase 2)
│   │   │   ├── KeywordHighlighter.jsx  # 키워드 하이라이트 (Phase 2)
│   │   │   ├── RiskTimeline.jsx        # 리스크 타임라인 (Phase 2)
│   │   │   ├── ComparisonCard.jsx      # 상품 비교 (Phase 3)
│   │   │   └── ReportGenerator.jsx     # PDF 리포트 (Phase 3)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # 메인 페이지
│   │   │   └── ResultPage.jsx          # 결과 페이지
│   │   ├── services/
│   │   │   └── api.js                  # API 클라이언트
│   │   └── App.jsx
│   └── package.json
│
├── server/                      # Express 백엔드
│   ├── src/
│   │   ├── routes/
│   │   │   ├── analyze.js              # POST /api/analyze
│   │   │   ├── alternatives.js         # GET /api/alternatives (요구사항 6)
│   │   │   ├── history.js              # GET /api/history (Phase 2)
│   │   │   ├── compare.js              # POST /api/compare (Phase 3)
│   │   │   └── report.js               # POST /api/report (Phase 3)
│   │   ├── services/
│   │   │   ├── crawler.js              # 크롤링 서비스 (요구사항 1)
│   │   │   ├── priceAnalyzer.js        # 가격 분석 (요구사항 2)
│   │   │   ├── sellerAnalyzer.js       # 판매자 분석 (요구사항 3)
│   │   │   ├── reviewAnalyzer.js       # 리뷰 분석 (요구사항 4)
│   │   │   ├── bedrockService.js       # AWS Bedrock 클라이언트
│   │   │   ├── riskEngine.js           # BRS 계산 (요구사항 5)
│   │   │   ├── recommender.js          # 대안 추천 (요구사항 6)
│   │   │   ├── aiCommentService.js     # AI 코멘트 (Phase 2)
│   │   │   ├── keywordDetector.js      # 키워드 감지 (Phase 2)
│   │   │   └── fraudReportService.js   # 사기 신고 (Phase 3)
│   │   ├── models/
│   │   │   ├── Product.js              # 상품 모델
│   │   │   ├── Analysis.js             # 분석 결과 모델
│   │   │   └── FraudReport.js          # 사기 신고 모델 (Phase 3)
│   │   ├── db/
│   │   │   ├── dynamodb.js             # DynamoDB 클라이언트
│   │   │   └── cache.js                # 캐시 레이어
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js          # 속도 제한 (요구사항 8)
│   │   │   ├── errorHandler.js         # 오류 처리 (요구사항 7)
│   │   │   └── validator.js            # 입력 검증
│   │   ├── utils/
│   │   │   ├── logger.js               # Winston 로거
│   │   │   └── retry.js                # 재시도 로직
│   │   └── app.js
│   └── package.json
│
├── .env.example                 # 환경 변수 템플릿
├── ecosystem.config.js          # PM2 설정
├── nginx.conf                   # Nginx 설정
└── package.json                 # 루트
```


## 핵심 컴포넌트 및 인터페이스

### 1. API 엔드포인트 (Express Routes)

#### MVP (요구사항 10)

**POST /api/analyze**
```javascript
// 요구사항 1-5: 상품 분석
Request: { 
  url: string  // 쿠팡, 네이버쇼핑, 11번가 URL
}

Response: {
  brs: number,                    // 0-100 (요구사항 5)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',  // 0-30/31-60/61+
  reasonCodes: string[],          // 10점 이상 기여 요소
  analyses: {
    price: {
      score: number,              // 0-40점 (요구사항 2)
      median: number,
      mad: number,
      isOutlier: boolean
    },
    seller: {
      score: number,              // 0-20점 (요구사항 3)
      trustScore: number,         // 0-100
      accountAge: number,
      hasReturnPolicy: boolean,
      shippingLocation: string
    },
    review: {
      score: number,              // 0-10점 (요구사항 4)
      totalReviews: number,
      patterns: {
        hasReviewSurge: boolean,  // 3일 내 50% 이상
        hasRepetition: boolean,   // 동일 문구 30% 이상
        lacksDiversity: boolean   // 긍정 90% 이상
      },
      sentiment: {
        positive: number,         // AI 분석 결과
        neutral: number,
        negative: number
      },
      abusingKeywords: string[]   // 마케팅성 키워드
    }
  },
  recommendations: Array,         // 요구사항 6: BRS > 40일 때
  analyzedAt: string,
  processingTime: number          // 요구사항 5: 10초 이내
}
```

**GET /api/alternatives?productName={name}**
```javascript
// 요구사항 6: 대안 상품 추천
Response: {
  alternatives: [
    {
      url: string,
      title: string,
      price: number,
      platform: string,
      brs: number,              // 각 상품의 BRS 명시
      seller: {
        name: string,
        trustScore: number
      }
    }
  ],
  sortedBy: 'price_asc'         // 가격 오름차순
}
```

#### Phase 2

**GET /api/history/:productId**
```javascript
// 요구사항 14: 리스크 타임라인
Response: {
  history: [
    {
      analyzedAt: string,
      brs: number,
      price: number,
      sellerTrustScore: number
    }
  ],
  minRecords: 2                 // 최소 2개 이상일 때만 반환
}
```

**POST /api/ai-comment**
```javascript
// 요구사항 11: AI 추천 코멘트
Request: {
  brs: number,
  analyses: object
}

Response: {
  comment: string,              // 자연어 요약
  tone: 'safe' | 'neutral' | 'alert',  // BRS 기반
  color: 'green' | 'orange' | 'red'
}
```

#### Phase 3

**POST /api/compare**
```javascript
// 요구사항 15: 상품 비교
Request: {
  urls: [string, string]        // 2개 URL
}

Response: {
  comparison: {
    product1: { brs, price, seller, reviews },
    product2: { brs, price, seller, reviews },
    differences: {
      brs: number,
      price: number,
      sellerTrust: number
    },
    recommendation: 'product1' | 'product2'
  }
}
```

**POST /api/report**
```javascript
// 요구사항 17: 사기 신고
Request: {
  url: string,
  reason: string,
  userId?: string
}

Response: {
  reportId: string,
  totalReports: number,
  showWarning: boolean          // 일정 수준 이상이면 true
}
```

### 2. Crawler Service (요구사항 1)

**책임**: 쿠팡, 네이버쇼핑, 11번가에서 상품 정보 수집

**인터페이스**:
```javascript
class CrawlerService {
  async crawl(url) {
    // 1. URL에서 플랫폼 식별
    // 2. 플랫폼별 파서 선택
    // 3. Cheerio로 HTML 파싱
    // 4. 상품 정보 추출
    return {
      productId: string,
      platform: string,
      title: string,
      price: number,
      seller: {
        name: string,
        accountAge: number,
        hasReturnPolicy: boolean,
        shippingLocation: string
      },
      reviews: [
        {
          content: string,
          rating: number,
          date: string,
          author: string
        }
      ]
    }
  }
}
```

**오류 처리 (요구사항 7)**:
- 3회 재시도
- 5초 타임아웃
- 실패 시 부분 결과 반환

**캐싱 (요구사항 8)**:
- DynamoDB에 6시간 캐싱
- TTL 자동 삭제

### 3. Price Analyzer (요구사항 2)

**책임**: 가격 이상치 탐지 및 위험 점수 계산

**알고리즘**:
```javascript
class PriceAnalyzer {
  async analyze(product) {
    // 1. DynamoDB에서 동일 상품명의 가격 이력 조회
    const priceHistory = await this.getPriceHistory(product.title);
    
    // 2. Median + MAD 계산
    const median = this.calculateMedian(priceHistory);
    const mad = this.calculateMAD(priceHistory, median);
    
    // 3. 이상치 판정
    const isOutlier = Math.abs(product.price - median) > 3 * mad;
    
    // 4. 위험 점수 계산 (0-40점)
    const score = isOutlier ? 40 : 0;
    
    return { score, median, mad, isOutlier };
  }
}
```

**데이터 소스**:
- DynamoDB `PriceHistory` 테이블
- 정규화된 상품명으로 검색
- 30일 이력 유지 (TTL)

### 4. Seller Analyzer (요구사항 3)

**책임**: 판매자 신뢰도 평가

**평가 기준**:
```javascript
class SellerAnalyzer {
  analyze(seller) {
    let trustScore = 100;
    
    // 계정 연령 (최대 -30점)
    if (seller.accountAge < 30) trustScore -= 30;
    else if (seller.accountAge < 90) trustScore -= 15;
    
    // 반품 정책 (-20점)
    if (!seller.hasReturnPolicy) trustScore -= 20;
    
    // 배송지 (-10점)
    if (seller.shippingLocation === '해외') trustScore -= 10;
    
    // 위험 점수 계산
    const score = trustScore < 50 ? 20 : 0;
    
    return { score, trustScore };
  }
}
```

### 5. Review Analyzer (요구사항 4)

**책임**: 리뷰 패턴 분석 및 AI 기반 감정 분석

**구현**:
```javascript
class ReviewAnalyzer {
  async analyze(reviews) {
    // 1. 최대 30개 리뷰 수집
    const recentReviews = reviews.slice(0, 30);
    
    // 2. 규칙 기반 패턴 탐지
    const patterns = {
      hasReviewSurge: this.detectSurge(recentReviews),      // 3일 내 50% 이상
      hasRepetition: this.detectRepetition(recentReviews),  // 동일 문구 30% 이상
      lacksDiversity: false  // AI 분석 후 결정
    };
    
    // 3. AWS Bedrock Claude Sonnet 4.0 감정 분석
    const sentimentResults = await this.analyzeSentiment(recentReviews);
    
    // 4. 감정 다양성 평가
    const positiveRatio = sentimentResults.positive / recentReviews.length;
    patterns.lacksDiversity = positiveRatio > 0.9;
    
    // 5. 어뷰징 키워드 탐지
    const abusingKeywords = this.detectAbusingKeywords(recentReviews);
    
    // 6. 위험 점수 계산 (최대 10점)
    let score = 0;
    if (patterns.lacksDiversity) score += 5;
    if (abusingKeywords.length > 0) score += 3;
    if (patterns.lacksDiversity && abusingKeywords.length > 0) score = 10;
    
    return {
      score,
      patterns,
      sentiment: sentimentResults,
      abusingKeywords
    };
  }
  
  async analyzeSentiment(reviews) {
    // AWS Bedrock 호출 (bedrockService.js)
    const prompt = this.buildPrompt(reviews);
    const result = await bedrockService.invoke(prompt);
    
    // 긍정/중립/부정 집계
    return {
      positive: result.filter(r => r.sentiment === 'positive').length,
      neutral: result.filter(r => r.sentiment === 'neutral').length,
      negative: result.filter(r => r.sentiment === 'negative').length
    };
  }
  
  detectAbusingKeywords(reviews) {
    const keywords = ['정품', '공식', '최저가', '가성비'];
    const detected = [];
    
    reviews.forEach(review => {
      keywords.forEach(keyword => {
        if (review.content.includes(keyword)) {
          detected.push(keyword);
        }
      });
    });
    
    return [...new Set(detected)];  // 중복 제거
  }
}
```

**AI 프롬프트 설계**:
```javascript
buildPrompt(reviews) {
  return `
다음은 온라인 쇼핑몰 상품 리뷰 목록입니다. 각 리뷰를 분석하여 JSON 배열로 답변해주세요.

리뷰 목록:
${reviews.map((r, i) => `${i+1}. ${r.content}`).join('\n')}

각 리뷰에 대해 다음을 분석:
1. sentiment: "positive", "neutral", "negative"
2. hasMarketingKeywords: true/false (정품, 공식, 최저가, 가성비 등 포함 여부)
3. hasExcessivePositivity: true/false (과도한 긍정 표현)

응답 형식: [{"sentiment": "...", "hasMarketingKeywords": ..., "hasExcessivePositivity": ...}, ...]

JSON 배열만 반환하고 다른 설명은 포함하지 마세요.
`;
}
```

**폴백 전략 (요구사항 7)**:
- AI 호출 실패 시 규칙 기반 감정 분석
- 긍정/부정 키워드 사전 사용
- 부분 분석 결과로 계속 진행

### 6. Risk Engine (요구사항 5)

**책임**: BRS 계산 및 분류

**구현**:
```javascript
class RiskEngine {
  calculate(analyses) {
    // 1. 점수 합산
    const brs = analyses.price.score + 
                analyses.seller.score + 
                analyses.review.score;
    
    // 2. 위험 수준 분류
    let riskLevel;
    if (brs <= 30) riskLevel = 'LOW';
    else if (brs <= 60) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
    
    // 3. 근거 코드 생성 (10점 이상 기여 요소만)
    const reasonCodes = [];
    if (analyses.price.score >= 10) reasonCodes.push('PRICE_OUTLIER');
    if (analyses.seller.score >= 10) reasonCodes.push('LOW_SELLER_TRUST');
    if (analyses.review.score >= 10) reasonCodes.push('REVIEW_ABUSING');
    
    return { brs, riskLevel, reasonCodes };
  }
}
```

**성능 요구사항 (요구사항 5)**:
- 전체 분석 10초 이내 완료
- 병렬 처리: Promise.all([price, seller, review])

### 7. Recommender (요구사항 6)

**책임**: 대안 상품 추천

**구현**:
```javascript
class Recommender {
  async recommend(product, brs) {
    // BRS > 40일 때만 추천
    if (brs <= 40) return [];
    
    // 1. 동일 상품명으로 검색
    const alternatives = await this.searchAlternatives(product.title);
    
    // 2. 각 대안의 BRS 계산
    const analyzed = await Promise.all(
      alternatives.map(async alt => {
        const analysis = await this.analyzeProduct(alt);
        return {
          ...alt,
          brs: analysis.brs  // BRS 명시적 표시
        };
      })
    );
    
    // 3. 가격 오름차순 정렬
    return analyzed.sort((a, b) => a.price - b.price);
  }
}
```

**중요**: 모든 대안 상품을 반환하며, 사용자가 BRS를 보고 직접 판단


## 데이터 모델 (AWS DynamoDB)

### Products 테이블 (요구사항 8: 캐싱)

**목적**: 크롤링된 상품 데이터를 6시간 동안 캐싱

```javascript
{
  PK: "PRODUCT#<platform>#<productId>",
  SK: "METADATA",
  productId: string,
  platform: string,              // 'coupang' | 'naver' | '11st'
  title: string,
  normalizedTitle: string,       // 검색용 정규화된 제목
  price: number,
  seller: {
    name: string,
    accountAge: number,          // 일 단위
    hasReturnPolicy: boolean,
    shippingLocation: string
  },
  reviews: [
    {
      content: string,
      rating: number,
      date: string,
      author: string
    }
  ],
  crawledAt: number,             // Unix timestamp
  ttl: number                    // 6시간 후 자동 삭제
}
```

**인덱스**:
- **GSI1**: normalizedTitle (상품명 검색용, 요구사항 6)
  - PK: normalizedTitle
  - SK: platform

### AnalysisResults 테이블

**목적**: 분석 결과 저장 및 이력 관리

```javascript
{
  PK: "ANALYSIS#<requestId>",
  SK: "RESULT",
  requestId: string,
  url: string,
  productId: string,
  platform: string,
  brs: number,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  reasonCodes: string[],
  analyses: {
    price: {
      score: number,
      median: number,
      mad: number,
      isOutlier: boolean
    },
    seller: {
      score: number,
      trustScore: number
    },
    review: {
      score: number,
      patterns: object,
      sentiment: object,
      abusingKeywords: string[]
    }
  },
  recommendations: array,
  aiComment?: string,            // Phase 2: 요구사항 11
  tone?: string,                 // Phase 2: 요구사항 11
  analyzedAt: number,
  processingTime: number
}
```

**인덱스**:
- **GSI1**: productId + analyzedAt (요구사항 14: 타임라인)
  - PK: productId
  - SK: analyzedAt

### PriceHistory 테이블 (요구사항 2)

**목적**: 가격 이력 저장 및 이상치 탐지

```javascript
{
  PK: "PRICE#<normalizedTitle>",
  SK: "PLATFORM#<platform>#<timestamp>",
  title: string,
  normalizedTitle: string,
  platform: string,
  price: number,
  recordedAt: number,
  ttl: number                    // 30일 후 자동 삭제
}
```

**인덱스**:
- **GSI1**: normalizedTitle + platform (플랫폼별 가격 조회)
  - PK: normalizedTitle
  - SK: platform#recordedAt

### FraudReports 테이블 (Phase 3: 요구사항 17)

**목적**: 사용자 참여형 사기 신고 DB

```javascript
{
  PK: "REPORT#<url_hash>",
  SK: "REPORT#<timestamp>",
  url: string,
  reason: string,
  userId?: string,
  votes: number,                 // 투표 수
  reportedAt: number,
  ttl: number                    // 90일 후 자동 삭제
}
```

**인덱스**:
- **GSI1**: url_hash + votes (신고 수 조회)
  - PK: url_hash
  - SK: votes

### DynamoDB 설정

**용량 모드**: On-Demand (무료 티어)
- 읽기: 25 RCU
- 쓰기: 25 WCU
- 스토리지: 25GB

**TTL 설정**:
- Products: 6시간 (요구사항 8)
- PriceHistory: 30일 (요구사항 14)
- AnalysisResults: 무제한 (이력 유지)
- FraudReports: 90일 (Phase 3)

## 오류 처리 전략 (요구사항 7)

### 1. 크롤링 오류

```javascript
class CrawlerService {
  async crawl(url, retries = 3) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      return this.parse(response.data);
    } catch (error) {
      if (retries > 0) {
        await this.delay(1000);
        return this.crawl(url, retries - 1);
      }
      
      // 3회 재시도 후 실패 → 부분 분석 결과 반환
      logger.error('Crawling failed after 3 retries', { url, error });
      return this.getPartialResult();
    }
  }
}
```

### 2. 외부 호출 타임아웃

```javascript
// 5초 타임아웃 설정
const analysisPromises = [
  Promise.race([
    priceAnalyzer.analyze(product),
    this.timeout(5000, { score: 0 })
  ]),
  Promise.race([
    sellerAnalyzer.analyze(product.seller),
    this.timeout(5000, { score: 0 })
  ]),
  Promise.race([
    reviewAnalyzer.analyze(product.reviews),
    this.timeout(5000, { score: 0 })
  ])
];

const results = await Promise.all(analysisPromises);
```

### 3. AI 호출 실패

```javascript
class ReviewAnalyzer {
  async analyzeSentiment(reviews) {
    try {
      return await bedrockService.invoke(this.buildPrompt(reviews));
    } catch (error) {
      logger.error('Bedrock API failed, using fallback', { error });
      
      // 규칙 기반 폴백 로직
      return this.fallbackSentimentAnalysis(reviews);
    }
  }
  
  fallbackSentimentAnalysis(reviews) {
    const positiveKeywords = ['좋아요', '만족', '추천', '최고'];
    const negativeKeywords = ['별로', '실망', '환불', '최악'];
    
    return reviews.map(review => {
      const hasPositive = positiveKeywords.some(k => review.content.includes(k));
      const hasNegative = negativeKeywords.some(k => review.content.includes(k));
      
      if (hasPositive && !hasNegative) return 'positive';
      if (hasNegative && !hasPositive) return 'negative';
      return 'neutral';
    });
  }
}
```

### 4. 로깅 (Winston)

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 보안 (요구사항 8)

### 1. Rate Limiting

```javascript
// rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,           // 1분
  max: 10,                       // 사용자당 10 요청
  message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = limiter;
```

### 2. 입력 검증 (Joi)

```javascript
// validator.js
const Joi = require('joi');

const analyzeSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^https?:\/\/(www\.)?(coupang|naver|11st)\.com/)
    .required()
    .messages({
      'string.pattern.base': '지원되는 쇼핑몰 URL만 입력 가능합니다.'
    })
});

const validateAnalyzeRequest = (req, res, next) => {
  const { error } = analyzeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateAnalyzeRequest };
```

### 3. 보안 헤더 (Helmet)

```javascript
// app.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### 4. CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3001',
  credentials: true
}));
```

### 5. 환경 변수

```bash
# .env
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
DYNAMODB_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com
ALLOWED_ORIGINS=https://yourdomain.com
```

## 테스트 전략

### 1. 단위 테스트 (Jest)

```javascript
// priceAnalyzer.test.js
describe('PriceAnalyzer', () => {
  test('should detect price outlier', async () => {
    const analyzer = new PriceAnalyzer();
    const result = await analyzer.analyze({
      title: '테스트 상품',
      price: 100000
    });
    
    expect(result.isOutlier).toBe(true);
    expect(result.score).toBe(40);
  });
});
```

### 2. 통합 테스트 (Supertest)

```javascript
// analyze.test.js
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/analyze', () => {
  test('should return analysis result', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ url: 'https://www.coupang.com/vp/products/123456' })
      .expect(200);
    
    expect(response.body).toHaveProperty('brs');
    expect(response.body).toHaveProperty('riskLevel');
    expect(response.body.processingTime).toBeLessThan(10000);
  });
});
```

### 3. E2E 테스트 (선택적)

```javascript
// e2e.test.js
const { test, expect } = require('@playwright/test');

test('complete analysis flow', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.fill('input[name="url"]', 'https://www.coupang.com/vp/products/123456');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.brs-score')).toBeVisible();
  await expect(page.locator('.risk-level')).toContainText(/LOW|MEDIUM|HIGH/);
});

## 배포 (요구사항 9)

### AWS Lightsail 설정

**인스턴스 스펙**:
- vCPU: 1개
- RAM: 1GB
- SSD: 40GB
- 전송량: 2TB/월
- 비용: $5/월

**설치 스크립트**:
```bash
#!/bin/bash

# 1. Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. AWS CLI 설치 (DynamoDB 접근용)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 3. AWS 자격 증명 설정
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region us-east-1

# 4. Nginx 설치
sudo apt-get install -y nginx

# 5. PM2 설치
sudo npm install -g pm2

# 6. 애플리케이션 배포
cd /opt
sudo git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 7. 의존성 설치
sudo npm install
cd client && sudo npm install && cd ..
cd server && sudo npm install && cd ..

# 8. 프론트엔드 빌드
cd client && sudo npm run build && cd ..

# 9. 환경 변수 설정
sudo cp .env.example .env
sudo nano .env  # 실제 값 입력

# 10. PM2로 백엔드 시작
cd server
pm2 start src/app.js --name shopping-fraud-api
pm2 startup
pm2 save

# 11. Nginx 설정
sudo cp /opt/shopping-fraud-detector/nginx.conf /etc/nginx/sites-available/shopping-fraud
sudo ln -s /etc/nginx/sites-available/shopping-fraud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "배포 완료!"
```

### Nginx 설정 (nginx.conf)

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # 로그 설정
  access_log /var/log/nginx/shopping-fraud-access.log;
  error_log /var/log/nginx/shopping-fraud-error.log;

  # React 정적 파일
  location / {
    root /opt/shopping-fraud-detector/client/build;
    try_files $uri /index.html;
    
    # 캐싱 설정
    expires 1d;
    add_header Cache-Control "public, immutable";
  }

  # API 프록시
  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
    
    # 타임아웃 설정 (분석 시간 고려)
    proxy_connect_timeout 15s;
    proxy_send_timeout 15s;
    proxy_read_timeout 15s;
  }

  # 정적 파일 캐싱
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    root /opt/shopping-fraud-detector/client/build;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### PM2 설정 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'shopping-fraud-api',
    script: './server/src/app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
```

**PM2 명령어**:
```bash
# 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs shopping-fraud-api

# 재시작
pm2 restart shopping-fraud-api

# 중지
pm2 stop shopping-fraud-api

# 부팅 시 자동 시작
pm2 startup
pm2 save
```

## 개발 워크플로우

### 로컬 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 루트 의존성 설치
npm install

# 3. 클라이언트 의존성 설치
cd client
npm install
cd ..

# 4. 서버 의존성 설치
cd server
npm install
cd ..

# 5. DynamoDB Local 시작 (Docker 필요)
docker run -d -p 8000:8000 amazon/dynamodb-local:latest

# 6. AWS 자격 증명 설정
aws configure
# AWS Access Key ID: your_key
# AWS Secret Access Key: your_secret
# Default region name: us-east-1
# Default output format: json

# 7. 환경 변수 설정
cp .env.example .env
nano .env
```

**.env.example**:
```bash
# Server
NODE_ENV=development
PORT=3000

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000  # 로컬 개발용

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
BEDROCK_MAX_TOKENS=1000

# Security
ALLOWED_ORIGINS=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### 로컬 LLM 설정 (Ollama)

#### 1. Ollama 설치

**macOS/Linux**:
```bash
# Ollama 설치
curl -fsSL https://ollama.com/install.sh | sh

# 또는 Homebrew (macOS)
brew install ollama
```

**Docker 사용**:
```bash
# docker-compose로 실행
docker-compose -f docker-compose.local.yml up -d ollama
```

#### 2. 모델 다운로드

**Qwen 2.5 (권장 - 한국어 우수)**:
```bash
# 7B 모델 (8GB RAM 필요)
ollama pull qwen2.5:7b

# 또는 더 작은 모델
ollama pull qwen2.5:3b  # 4GB RAM
```

**GPT-OSS (대안)**:
```bash
# 경량 모델
ollama pull gpt-oss:latest
```

#### 3. 모델 테스트

```bash
# Ollama 서버 시작
ollama serve

# 다른 터미널에서 테스트
ollama run qwen2.5:7b "안녕하세요. 이 상품 리뷰를 분석해주세요: 정말 좋아요!"
```

#### 4. API 테스트

```bash
# REST API로 테스트
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "다음 리뷰의 감정을 분석해주세요: 정말 좋아요!",
  "stream": false
}'
```

### 개발 서버 시작

#### 방법 1: Docker Compose 사용 (권장)

```bash
# 1. 환경 변수 설정
cp .env.example .env.local
nano .env.local  # AI_PROVIDER=local 설정

# 2. Docker 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 3. Ollama 모델 다운로드 (최초 1회)
docker exec shopping-fraud-ollama-${USER} ollama pull qwen2.5:7b

# 4. DynamoDB 테이블 생성
npm run setup:dynamodb

# 5. 백엔드 서버 시작
cd server
npm run dev
# http://localhost:3000

# 6. 프론트엔드 서버 시작 (새 터미널)
cd client
npm start
# http://localhost:3001
```

#### 방법 2: 로컬 설치 사용

```bash
# 1. Ollama 서버 시작 (터미널 1)
ollama serve

# 2. DynamoDB Local 시작 (터미널 2)
docker run -d -p 8000:8000 amazon/dynamodb-local:latest

# 3. 백엔드 서버 시작 (터미널 3)
cd server
npm run dev

# 4. 프론트엔드 서버 시작 (터미널 4)
cd client
npm start
```

### 프로덕션 빌드

```bash
# 1. 프론트엔드 빌드
cd client
npm run build

# 2. 백엔드 시작
cd ../server
npm start

# 3. 또는 PM2로 시작
pm2 start ecosystem.config.js
```

### DynamoDB 테이블 생성

#### 자동 설정 스크립트 (scripts/setup-dynamodb.js)

```javascript
// scripts/setup-dynamodb.js
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const tables = [
  {
    TableName: 'Products',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'normalizedTitle', AttributeType: 'S' },
      { AttributeName: 'platform', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'normalizedTitle', KeyType: 'HASH' },
          { AttributeName: 'platform', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'AnalysisResults',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'productId', AttributeType: 'S' },
      { AttributeName: 'analyzedAt', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'productId', KeyType: 'HASH' },
          { AttributeName: 'analyzedAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'PriceHistory',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'normalizedTitle', AttributeType: 'S' },
      { AttributeName: 'platform', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'normalizedTitle', KeyType: 'HASH' },
          { AttributeName: 'platform', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  },
  {
    TableName: 'FraudReports',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  }
];

async function setupTables() {
  try {
    // 기존 테이블 확인
    const { TableNames } = await client.send(new ListTablesCommand({}));
    console.log('Existing tables:', TableNames);
    
    // 테이블 생성
    for (const table of tables) {
      if (TableNames.includes(table.TableName)) {
        console.log(`Table ${table.TableName} already exists, skipping...`);
        continue;
      }
      
      console.log(`Creating table ${table.TableName}...`);
      await client.send(new CreateTableCommand(table));
      console.log(`Table ${table.TableName} created successfully`);
    }
    
    console.log('All tables setup complete!');
  } catch (error) {
    console.error('Error setting up tables:', error);
    process.exit(1);
  }
}

setupTables();
```

#### package.json 스크립트 추가

```json
{
  "scripts": {
    "setup:dynamodb": "node scripts/setup-dynamodb.js",
    "setup:ollama": "node scripts/setup-ollama.js",
    "setup:local": "npm run setup:dynamodb && npm run setup:ollama",
    "dev:local": "docker-compose -f docker-compose.local.yml up -d && npm run setup:local && npm run dev"
  }
}
```

#### Ollama 설정 스크립트 (scripts/setup-ollama.js)

```javascript
// scripts/setup-ollama.js
const axios = require('axios');

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

async function checkOllama() {
  try {
    await axios.get(`${OLLAMA_ENDPOINT}/api/tags`);
    console.log('✓ Ollama is running');
    return true;
  } catch (error) {
    console.error('✗ Ollama is not running. Please start Ollama first.');
    console.log('  Run: ollama serve');
    console.log('  Or: docker-compose -f docker-compose.local.yml up -d ollama');
    return false;
  }
}

async function checkModel() {
  try {
    const response = await axios.get(`${OLLAMA_ENDPOINT}/api/tags`);
    const models = response.data.models || [];
    const hasModel = models.some(m => m.name === OLLAMA_MODEL);
    
    if (hasModel) {
      console.log(`✓ Model ${OLLAMA_MODEL} is available`);
      return true;
    } else {
      console.log(`✗ Model ${OLLAMA_MODEL} not found`);
      return false;
    }
  } catch (error) {
    console.error('Error checking models:', error.message);
    return false;
  }
}

async function pullModel() {
  console.log(`Pulling model ${OLLAMA_MODEL}... (this may take a few minutes)`);
  
  try {
    const response = await axios.post(`${OLLAMA_ENDPOINT}/api/pull`, {
      name: OLLAMA_MODEL
    }, {
      timeout: 600000  // 10분 타임아웃
    });
    
    console.log(`✓ Model ${OLLAMA_MODEL} pulled successfully`);
    return true;
  } catch (error) {
    console.error('Error pulling model:', error.message);
    return false;
  }
}

async function setup() {
  console.log('Setting up Ollama...\n');
  
  // 1. Ollama 실행 확인
  const isRunning = await checkOllama();
  if (!isRunning) {
    process.exit(1);
  }
  
  // 2. 모델 확인
  const hasModel = await checkModel();
  
  // 3. 모델 다운로드
  if (!hasModel) {
    console.log('\nDownloading model...');
    const pulled = await pullModel();
    if (!pulled) {
      process.exit(1);
    }
  }
  
  console.log('\n✓ Ollama setup complete!');
  console.log(`\nYou can now use AI_PROVIDER=local in your .env.local file`);
}

setup();
```

## 협업 워크플로우

### 개발자 온보딩

#### 1. 초기 설정 (최초 1회)

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 의존성 설치
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 3. 환경 변수 설정
cp .env.example .env.local

# 개발자별 포트 설정 (충돌 방지)
# Developer 1: PORT=3000, CLIENT_PORT=3001, DYNAMODB_PORT=8000
# Developer 2: PORT=3010, CLIENT_PORT=3011, DYNAMODB_PORT=8010
# Developer 3: PORT=3020, CLIENT_PORT=3021, DYNAMODB_PORT=8020

nano .env.local  # 포트 및 AI_PROVIDER 설정

# 4. Docker 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 5. 로컬 환경 설정
npm run setup:local

# 6. 개발 서버 시작
npm run dev
```

#### 2. 일일 개발 워크플로우

```bash
# 아침: 최신 코드 가져오기
git pull origin main

# Docker 서비스 시작 (필요시)
docker-compose -f docker-compose.local.yml up -d

# 개발 서버 시작
npm run dev

# 저녁: 작업 커밋
git add .
git commit -m "feat: 기능 구현"
git push origin feature/your-feature
```

#### 3. 브랜치 전략

```
main (프로덕션)
  ├── develop (개발)
  │   ├── feature/crawler (개발자 1)
  │   ├── feature/price-analyzer (개발자 2)
  │   └── feature/review-analyzer (개발자 3)
  └── hotfix/* (긴급 수정)
```

### 독립적인 개발 환경 보장

#### 포트 충돌 방지

**개발자별 포트 할당표**:

| 개발자 | Backend | Frontend | DynamoDB | Ollama |
|--------|---------|----------|----------|--------|
| Dev 1  | 3000    | 3001     | 8000     | 11434  |
| Dev 2  | 3010    | 3011     | 8010     | 11444  |
| Dev 3  | 3020    | 3021     | 8020     | 11454  |
| Dev 4  | 3030    | 3031     | 8030     | 11464  |

#### 데이터 격리

**개발자별 Docker 볼륨**:
```bash
# docker-compose.local.yml에서 자동 처리
dynamodb-data-${USER}  # 개발자별 DynamoDB 데이터
ollama-data-${USER}    # 개발자별 Ollama 모델
```

**개발자별 DynamoDB 테이블 접두사** (선택사항):
```javascript
// db/dynamodb.js
const TABLE_PREFIX = process.env.DEVELOPER_NAME || '';

const getTableName = (name) => {
  return TABLE_PREFIX ? `${TABLE_PREFIX}_${name}` : name;
};

// 사용 예
const tableName = getTableName('Products');  // 'developer1_Products'
```

### AI 프로바이더 전환

#### 로컬 개발 → 프로덕션 전환

```bash
# 로컬 개발 (.env.local)
AI_PROVIDER=local
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# 프로덕션 (.env)
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=actual_key
AWS_SECRET_ACCESS_KEY=actual_secret
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
```

#### 프로바이더별 성능 비교

| 항목 | AWS Bedrock | Claude API | Ollama (Qwen 2.5 7B) | Ollama (GPT-OSS) |
|------|-------------|------------|----------------------|------------------|
| 비용 | $0.003/1K 토큰 | $0.003/1K 토큰 | 무료 | 무료 |
| 응답 속도 | 1-2초 | 1-2초 | 2-5초 | 1-3초 |
| 한국어 품질 | 우수 | 우수 | 우수 | 보통 |
| 오프라인 | 불가 | 불가 | 가능 | 가능 |
| 설정 난이도 | 높음 (AWS 계정) | 낮음 (API Key) | 중간 (Docker) | 중간 (Docker) |
| RAM 요구사항 | - | - | 8GB | 4GB |

**권장 사용 시나리오**:
- **AWS Bedrock**: 프로덕션 환경, AWS 인프라 사용 중
- **Claude API**: 로컬 개발, AWS 계정 없음, 빠른 설정 필요
- **Ollama (Qwen)**: 로컬 개발, 완전 무료, 오프라인 작업
- **Ollama (GPT-OSS)**: 로컬 개발, 저사양 PC, 빠른 응답 필요

### 트러블슈팅

#### Ollama 연결 실패

```bash
# 1. Ollama 실행 확인
curl http://localhost:11434/api/tags

# 2. Docker 컨테이너 확인
docker ps | grep ollama

# 3. 로그 확인
docker logs shopping-fraud-ollama-${USER}

# 4. 재시작
docker-compose -f docker-compose.local.yml restart ollama
```

#### DynamoDB 연결 실패

```bash
# 1. DynamoDB 실행 확인
aws dynamodb list-tables --endpoint-url http://localhost:8000

# 2. Docker 컨테이너 확인
docker ps | grep dynamodb

# 3. 테이블 재생성
npm run setup:dynamodb
```

#### 포트 충돌

```bash
# 1. 사용 중인 포트 확인
lsof -i :3000
lsof -i :8000

# 2. .env.local에서 다른 포트로 변경
PORT=3010
DYNAMODB_PORT=8010

# 3. 서버 재시작
npm run dev
```

## 비용 분석

### MVP (요구사항 1-10)

**AWS Lightsail: $5/월**
- vCPU: 1개
- RAM: 1GB
- SSD: 40GB
- 전송량: 2TB/월

**AWS DynamoDB: 무료 티어**
- 읽기: 25 RCU (충분)
- 쓰기: 25 WCU (충분)
- 스토리지: 25GB (충분)
- 월 10,000 요청 기준: 무료 티어 내

**AWS Bedrock Claude Sonnet 4.0: $2-4/월**
- 입력 토큰: $0.003/1K 토큰
- 출력 토큰: $0.015/1K 토큰
- 월 10,000 요청 기준 (리뷰당 평균 500 토큰):
  - 입력: 10,000 × 0.5K × $0.003 = $15
  - 출력: 10,000 × 0.1K × $0.015 = $15
  - 총: $30/월 (캐싱으로 실제 $2-4/월)

**총 예상 비용: $7-9/월**

### Phase 2 (요구사항 11-14)

**추가 비용**:
- AI 코멘트 생성: +$1-2/월 (요청당 추가 AI 호출)
- DynamoDB 스토리지 증가: 무료 티어 내

**총 예상 비용: $8-11/월**

### Phase 3 (요구사항 15-17)

**추가 비용**:
- 사용자 참여형 DB: +$0-1/월 (스토리지 증가)
- 상품 비교 기능: 비용 변화 없음 (기존 API 재사용)

**총 예상 비용: $8-12/월**

## Phase 2 설계 (요구사항 11-14)

### 1. AI 추천 코멘트 (요구사항 11)

**목적**: 분석 결과를 자연어로 요약하여 사용자 이해도 향상

**구현**:
```javascript
class AICommentService {
  async generateComment(brs, analyses) {
    // 1. 톤 결정
    let tone, color;
    if (brs > 60) {
      tone = 'alert';
      color = 'red';
    } else if (brs > 30) {
      tone = 'neutral';
      color = 'orange';
    } else {
      tone = 'safe';
      color = 'green';
    }
    
    // 2. AI 프롬프트 생성
    const prompt = `
다음 분석 결과를 바탕으로 사용자에게 ${tone} 톤으로 요약 코멘트를 작성해주세요.

BRS: ${brs}점
가격 이상: ${analyses.price.isOutlier ? '있음' : '없음'}
판매자 신뢰도: ${analyses.seller.trustScore}점
리뷰 패턴: ${JSON.stringify(analyses.review.patterns)}

2-3문장으로 핵심만 요약해주세요.
`;
    
    // 3. Bedrock 호출
    const comment = await bedrockService.invoke(prompt);
    
    return { comment, tone, color };
  }
}
```

**API 응답 확장**:
```javascript
{
  brs: 65,
  riskLevel: 'HIGH',
  aiComment: {
    comment: "이 상품은 최근 리뷰 폭증이 감지되었으며, 가격도 시장 평균보다 높습니다. 구매 전 신중한 검토가 필요합니다.",
    tone: 'alert',
    color: 'red'
  }
}
```

### 2. 리뷰 감정 지도 (요구사항 12)

**목적**: 리뷰 감정 분포를 시각화하여 한눈에 파악

**구현**:
```javascript
class ReviewAnalyzer {
  async generateSentimentMap(reviews) {
    // 1. AI 감정 분석 (기존 로직 재사용)
    const sentiments = await this.analyzeSentiment(reviews);
    
    // 2. 감정 집계
    const distribution = {
      positive: sentiments.filter(s => s === 'positive').length,
      neutral: sentiments.filter(s => s === 'neutral').length,
      negative: sentiments.filter(s => s === 'negative').length
    };
    
    // 3. 부정 리뷰 키워드 추출
    const negativeReviews = reviews.filter((r, i) => sentiments[i] === 'negative');
    const keywords = this.extractTopKeywords(negativeReviews, 5);
    
    return {
      distribution,
      negativeKeywords: keywords  // [{ word: '배송', count: 5 }, ...]
    };
  }
  
  extractTopKeywords(reviews, topN) {
    const wordCounts = {};
    const stopWords = ['이', '그', '저', '것', '수', '등'];
    
    reviews.forEach(review => {
      const words = review.content.split(/\s+/);
      words.forEach(word => {
        if (word.length > 1 && !stopWords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }));
  }
}
```

**프론트엔드 (Chart.js)**:
```javascript
// SentimentChart.jsx
import { Pie } from 'react-chartjs-2';

function SentimentChart({ distribution }) {
  const data = {
    labels: ['긍정', '중립', '부정'],
    datasets: [{
      data: [distribution.positive, distribution.neutral, distribution.negative],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
    }]
  };
  
  return <Pie data={data} />;
}
```

### 3. 위험 키워드 감지기 (요구사항 13)

**목적**: 사기성 키워드를 자동 탐지 및 하이라이트

**키워드 사전**:
```javascript
const FRAUD_KEYWORDS = {
  high: ['정품 보장', '공식몰', '원가 이하', '무조건 환불'],  // 가중치 3
  medium: ['최저가', '가성비', '특가', '한정 수량'],          // 가중치 2
  low: ['추천', '인기', '베스트']                            // 가중치 1
};
```

**구현**:
```javascript
class KeywordDetector {
  detect(text) {
    const detected = [];
    let totalScore = 0;
    
    Object.entries(FRAUD_KEYWORDS).forEach(([level, keywords]) => {
      const weight = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
      
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          detected.push({ keyword, level, weight });
          totalScore += weight;
        }
      });
    });
    
    return {
      keywords: detected,
      totalScore,
      riskLevel: totalScore > 10 ? 'HIGH' : totalScore > 5 ? 'MEDIUM' : 'LOW'
    };
  }
  
  highlight(text, keywords) {
    let highlighted = text;
    keywords.forEach(({ keyword, level }) => {
      const color = level === 'high' ? 'red' : level === 'medium' ? 'orange' : 'yellow';
      highlighted = highlighted.replace(
        new RegExp(keyword, 'g'),
        `<mark style="background-color: ${color}">${keyword}</mark>`
      );
    });
    return highlighted;
  }
}
```

### 4. 리스크 타임라인 (요구사항 14)

**목적**: 동일 상품의 위험도 변화 추이 시각화

**구현**:
```javascript
class HistoryService {
  async getTimeline(productId) {
    // 1. DynamoDB에서 이력 조회 (GSI1 사용)
    const history = await dynamodb.query({
      TableName: 'AnalysisResults',
      IndexName: 'GSI1',
      KeyConditionExpression: 'productId = :pid',
      ExpressionAttributeValues: {
        ':pid': productId
      },
      ScanIndexForward: true  // 시간순 정렬
    });
    
    // 2. 최소 2개 이상일 때만 반환
    if (history.length < 2) {
      return null;
    }
    
    // 3. 타임라인 데이터 구성
    return history.map(record => ({
      date: new Date(record.analyzedAt).toISOString(),
      brs: record.brs,
      price: record.analyses.price.score,
      sellerTrust: record.analyses.seller.trustScore
    }));
  }
}
```

**프론트엔드 (Chart.js)**:
```javascript
// RiskTimeline.jsx
import { Line } from 'react-chartjs-2';

function RiskTimeline({ timeline }) {
  const data = {
    labels: timeline.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'BRS',
        data: timeline.map(t => t.brs),
        borderColor: '#ef4444',
        tension: 0.1
      },
      {
        label: '가격 위험도',
        data: timeline.map(t => t.price),
        borderColor: '#f59e0b',
        tension: 0.1
      },
      {
        label: '판매자 신뢰도',
        data: timeline.map(t => t.sellerTrust),
        borderColor: '#10b981',
        tension: 0.1
      }
    ]
  };
  
  return <Line data={data} />;
}
```

## Phase 3 설계 (요구사항 15-17)

### 1. 상품 비교 카드 (요구사항 15)

**목적**: 두 상품을 동시 비교하여 구매 결정 지원

**구현**:
```javascript
class ComparisonService {
  async compare(url1, url2) {
    // 1. 병렬 분석 (Promise.all)
    const [analysis1, analysis2] = await Promise.all([
      this.analyzeProduct(url1),
      this.analyzeProduct(url2)
    ]);
    
    // 2. 차이 계산
    const differences = {
      brs: Math.abs(analysis1.brs - analysis2.brs),
      price: Math.abs(analysis1.analyses.price.score - analysis2.analyses.price.score),
      sellerTrust: Math.abs(
        analysis1.analyses.seller.trustScore - 
        analysis2.analyses.seller.trustScore
      )
    };
    
    // 3. 추천 결정
    const recommendation = analysis1.brs < analysis2.brs ? 'product1' : 'product2';
    
    return {
      product1: analysis1,
      product2: analysis2,
      differences,
      recommendation
    };
  }
}
```

**프론트엔드**:
```javascript
// ComparisonCard.jsx
function ComparisonCard({ comparison }) {
  return (
    <table>
      <thead>
        <tr>
          <th>항목</th>
          <th>상품 1</th>
          <th>상품 2</th>
        </tr>
      </thead>
      <tbody>
        <tr className={comparison.differences.brs > 20 ? 'highlight' : ''}>
          <td>BRS</td>
          <td>{comparison.product1.brs}</td>
          <td>{comparison.product2.brs}</td>
        </tr>
        {/* 가격, 판매자 신뢰도 등 */}
      </tbody>
    </table>
  );
}
```

### 2. 사기 리포트 생성기 (요구사항 16)

**목적**: 분석 결과를 PDF로 저장

**구현**:
```javascript
// 프론트엔드 (jsPDF)
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function generatePDF(analysis) {
  const doc = new jsPDF();
  
  // 1. 로고 및 제목
  doc.setFontSize(20);
  doc.text('쇼핑 흑우 감별사 분석 리포트', 20, 20);
  
  // 2. 분석 날짜
  doc.setFontSize(12);
  doc.text(`분석 날짜: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // 3. BRS 점수
  doc.setFontSize(16);
  doc.text(`BRS: ${analysis.brs}점 (${analysis.riskLevel})`, 20, 45);
  
  // 4. 분석 결과 테이블
  doc.autoTable({
    startY: 55,
    head: [['항목', '점수', '상세']],
    body: [
      ['가격', analysis.analyses.price.score, analysis.analyses.price.isOutlier ? '이상치' : '정상'],
      ['판매자', analysis.analyses.seller.score, `신뢰도 ${analysis.analyses.seller.trustScore}`],
      ['리뷰', analysis.analyses.review.score, `패턴 이상 ${Object.values(analysis.analyses.review.patterns).filter(Boolean).length}개`]
    ]
  });
  
  // 5. 저장
  doc.save(`fraud_report_${Date.now()}.pdf`);
}
```

### 3. 사용자 참여형 사기 DB (요구사항 17)

**목적**: 커뮤니티 기반 사기 신고 시스템

**구현**:
```javascript
class FraudReportService {
  async report(url, reason, userId) {
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    
    // 1. 신고 저장
    await dynamodb.put({
      TableName: 'FraudReports',
      Item: {
        PK: `REPORT#${urlHash}`,
        SK: `REPORT#${Date.now()}`,
        url,
        reason,
        userId,
        votes: 1,
        reportedAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60  // 90일
      }
    });
    
    // 2. 총 신고 수 조회
    const totalReports = await this.getTotalReports(urlHash);
    
    // 3. 경고 표시 여부 결정 (10건 이상)
    const showWarning = totalReports >= 10;
    
    return {
      reportId: urlHash,
      totalReports,
      showWarning
    };
  }
  
  async vote(reportId, userId) {
    // 투표 로직
    await dynamodb.update({
      TableName: 'FraudReports',
      Key: { PK: `REPORT#${reportId}`, SK: 'METADATA' },
      UpdateExpression: 'ADD votes :inc',
      ExpressionAttributeValues: { ':inc': 1 }
    });
  }
}
```

## 보류된 기능 (요구사항 18-19)

### 중고 대안 추천 (요구사항 18)

**보류 사유**:
- 상품명 정규화의 어려움 (브랜드명, 모델명 추출)
- 중고 플랫폼 크롤링 제한 (번개장터, 당근마켓)
- 매칭 정확도 문제 (동일 상품 판별 어려움)

### 판매자 평판 카드 (요구사항 19)

**보류 사유**:
- 여러 쇼핑몰의 판매자 프로파일링 어려움
- 판매자 식별자 통일 불가 (각 플랫폼마다 다름)
- 개인정보 보호 이슈


## 로컬 개발 환경 전략

### 협업을 위한 독립적인 로컬 환경

**목표**: 여러 개발자가 서로 간섭받지 않고 독립적으로 개발할 수 있는 환경 구성

**구성 요소**:
1. **로컬 DynamoDB**: Docker로 각자 독립 실행
2. **로컬 LLM**: Ollama + Qwen 또는 GPT-OSS
3. **환경 변수 분리**: `.env.local` 파일로 개인 설정 관리
4. **포트 충돌 방지**: 개발자별 포트 할당

**상세 가이드**: [docs/LOCAL_DEVELOPMENT.md](../docs/LOCAL_DEVELOPMENT.md) 참조

### 로컬 환경 구성

```bash
# docker-compose.local.yml
version: '3.8'

services:
  # 로컬 DynamoDB
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: shopping-fraud-dynamodb-${USER}
    ports:
      - "${DYNAMODB_PORT:-8000}:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    volumes:
      - ./dynamodb-data-${USER}:/home/dynamodblocal/data
    networks:
      - shopping-fraud-network

  # 로컬 LLM (Ollama)
  ollama:
    image: ollama/ollama:latest
    container_name: shopping-fraud-ollama-${USER}
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    volumes:
      - ./ollama-data-${USER}:/root/.ollama
    networks:
      - shopping-fraud-network

networks:
  shopping-fraud-network:
    driver: bridge
```

**개발자별 환경 변수 (.env.local)**:
```bash
# 개발자 식별
DEVELOPER_NAME=developer1

# 서버 포트 (개발자별 다르게 설정)
PORT=3000
CLIENT_PORT=3001

# 로컬 DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_PORT=8000

# LLM 설정 (AWS Bedrock 또는 로컬 LLM 선택)
AI_PROVIDER=local  # 'bedrock' 또는 'local'

# AWS Bedrock (프로덕션용)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0

# 로컬 LLM (개발용)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b  # 또는 gpt-oss

# 로깅
LOG_LEVEL=debug
```

## AI 전략 (멀티 프로바이더 지원)

### 지원 프로바이더

1. **AWS Bedrock Claude Sonnet 4.0** (프로덕션 권장)
   - 비용: $0.003/1K 입력 토큰
   - 한국어 성능 우수
   - IAM 기반 보안
   - AWS 계정 필요

2. **Claude API** (로컬 개발 - Bedrock 대안)
   - 비용: $0.003/1K 입력 토큰 (Bedrock과 동일)
   - API Key만으로 간편 사용
   - AWS 계정 불필요
   - 인터넷 연결 필요

3. **Ollama + Qwen 2.5** (로컬 개발 - 완전 무료)
   - 무료
   - 오프라인 사용 가능
   - 7B 모델 권장 (한국어 지원)
   - 8GB RAM 필요

4. **Ollama + GPT-OSS** (로컬 개발 - 경량)
   - 무료
   - 경량 모델
   - 빠른 응답 속도
   - 4GB RAM

### 사용 목적

**MVP (요구사항 4)**:
- 리뷰 감정 분석 (긍정/중립/부정)
- 마케팅성 키워드 탐지
- 과도한 긍정 표현 패턴 분석

**Phase 2 (요구사항 11)**:
- AI 추천 코멘트 생성
- 자연어 요약

### 비용 최적화 전략

**배치 처리**:
- 최대 30개 리뷰를 한 번에 분석 (요구사항 4)
- 단일 API 호출로 처리

**토큰 제한**:
- 요청당 최대 1000 토큰
- 리뷰당 평균 500 토큰 (입력 + 출력)

**캐싱 (요구사항 8)**:
- DynamoDB에 AI 분석 결과 캐싱
- 동일 리뷰 재분석 방지
- 6시간 TTL

**예상 비용**:
```
월 10,000 요청 기준:
- 입력: 10,000 × 0.5K × $0.003 = $15
- 출력: 10,000 × 0.1K × $0.015 = $15
- 총: $30/월

캐싱 적용 후 실제 비용: $2-4/월 (80-90% 절감)
```

### 구현

#### 1. AI 서비스 추상화 (멀티 프로바이더)

```javascript
// aiService.js (추상 인터페이스)
class AIService {
  constructor() {
    const provider = process.env.AI_PROVIDER || 'bedrock';
    
    if (provider === 'bedrock') {
      this.client = new BedrockClient();
    } else if (provider === 'claude') {
      this.client = new ClaudeAPIClient();
    } else if (provider === 'local') {
      this.client = new OllamaClient();
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
  
  async invoke(prompt) {
    return await this.client.invoke(prompt);
  }
}

module.exports = new AIService();
```

#### 2. AWS Bedrock 클라이언트

```javascript
// bedrockClient.js
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

class BedrockClient {
  constructor() {
    this.client = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || "us-east-1"
    });
    this.modelId = process.env.BEDROCK_MODEL_ID || "anthropic.claude-sonnet-4-20250514-v1:0";
    this.maxTokens = parseInt(process.env.BEDROCK_MAX_TOKENS) || 1000;
  }
  
  async invoke(prompt) {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: this.maxTokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
    
    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });
    
    try {
      const response = await this.client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      return result.content[0].text;
    } catch (error) {
      logger.error('Bedrock API error', { error });
      throw error;
    }
  }
}

module.exports = BedrockClient;
```

#### 3. Claude API 클라이언트

```javascript
// claudeAPIClient.js
const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAPIClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS) || 1000;
  }
  
  async invoke(prompt) {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      return message.content[0].text;
    } catch (error) {
      logger.error('Claude API error', { error });
      throw error;
    }
  }
}

module.exports = ClaudeAPIClient;
```

#### 4. Ollama 로컬 LLM 클라이언트

```javascript
// ollamaClient.js
const axios = require('axios');

class OllamaClient {
  constructor() {
    this.endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
    this.maxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS) || 1000;
  }
  
  async invoke(prompt) {
    try {
      const response = await axios.post(`${this.endpoint}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: this.maxTokens,
          temperature: 0.7
        }
      }, {
        timeout: 30000  // 30초 타임아웃
      });
      
      return response.data.response;
    } catch (error) {
      logger.error('Ollama API error', { error });
      throw error;
    }
  }
  
  // 모델 다운로드 확인
  async ensureModel() {
    try {
      const response = await axios.get(`${this.endpoint}/api/tags`);
      const models = response.data.models || [];
      const hasModel = models.some(m => m.name === this.model);
      
      if (!hasModel) {
        logger.warn(`Model ${this.model} not found. Pulling...`);
        await this.pullModel();
      }
    } catch (error) {
      logger.error('Failed to check Ollama models', { error });
    }
  }
  
  async pullModel() {
    try {
      await axios.post(`${this.endpoint}/api/pull`, {
        name: this.model
      });
      logger.info(`Model ${this.model} pulled successfully`);
    } catch (error) {
      logger.error('Failed to pull model', { error });
      throw error;
    }
  }
}

module.exports = OllamaClient;
```

#### 2. 리뷰 감정 분석 프롬프트 (요구사항 4)

```javascript
class ReviewAnalyzer {
  buildSentimentPrompt(reviews) {
    return `
다음은 온라인 쇼핑몰 상품 리뷰 목록입니다. 각 리뷰를 분석하여 JSON 배열로 답변해주세요.

리뷰 목록:
${reviews.map((r, i) => `${i+1}. ${r.content}`).join('\n')}

각 리뷰에 대해 다음을 분석:
1. sentiment: "positive", "neutral", "negative"
2. hasMarketingKeywords: true/false (정품, 공식, 최저가, 가성비 등 포함 여부)
3. hasExcessivePositivity: true/false (과도한 긍정 표현)

응답 형식: [{"sentiment": "...", "hasMarketingKeywords": ..., "hasExcessivePositivity": ...}, ...]

JSON 배열만 반환하고 다른 설명은 포함하지 마세요.
`;
  }
  
  async analyzeSentiment(reviews) {
    // 1. 캐시 확인
    const cacheKey = this.generateCacheKey(reviews);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    // 2. AI 호출
    const prompt = this.buildSentimentPrompt(reviews);
    const resultText = await bedrockService.invoke(prompt);
    const result = JSON.parse(resultText);
    
    // 3. 캐싱
    await cache.set(cacheKey, result, 6 * 60 * 60);  // 6시간
    
    return result;
  }
}
```

#### 3. AI 코멘트 생성 프롬프트 (Phase 2, 요구사항 11)

```javascript
class AICommentService {
  buildCommentPrompt(brs, analyses, tone) {
    return `
다음 분석 결과를 바탕으로 사용자에게 ${tone} 톤으로 요약 코멘트를 작성해주세요.

BRS: ${brs}점 (위험도: ${brs > 60 ? '높음' : brs > 30 ? '중간' : '낮음'})

분석 결과:
- 가격 이상: ${analyses.price.isOutlier ? '있음 (시장가 대비 높음)' : '없음'}
- 판매자 신뢰도: ${analyses.seller.trustScore}점
- 리뷰 패턴:
  * 리뷰 폭증: ${analyses.review.patterns.hasReviewSurge ? '있음' : '없음'}
  * 반복 패턴: ${analyses.review.patterns.hasRepetition ? '있음' : '없음'}
  * 감정 다양성 부족: ${analyses.review.patterns.lacksDiversity ? '있음' : '없음'}
- 어뷰징 키워드: ${analyses.review.abusingKeywords.join(', ') || '없음'}

요구사항:
1. 2-3문장으로 핵심만 요약
2. ${tone} 톤 사용 (safe: 안심, neutral: 주의, alert: 경고)
3. 구체적인 근거 포함
4. 사용자 친화적인 언어 사용

응답 형식: 텍스트만 반환 (JSON 없음)
`;
  }
  
  async generateComment(brs, analyses) {
    // 1. 톤 결정
    let tone;
    if (brs > 60) tone = 'alert';
    else if (brs > 30) tone = 'neutral';
    else tone = 'safe';
    
    // 2. AI 호출
    const prompt = this.buildCommentPrompt(brs, analyses, tone);
    const comment = await bedrockService.invoke(prompt);
    
    // 3. 색상 매핑
    const color = tone === 'alert' ? 'red' : tone === 'neutral' ? 'orange' : 'green';
    
    return { comment, tone, color };
  }
}
```

### 폴백 전략 (요구사항 7)

**AI 호출 실패 시 규칙 기반 분석**:

```javascript
class ReviewAnalyzer {
  fallbackSentimentAnalysis(reviews) {
    const positiveKeywords = ['좋아요', '만족', '추천', '최고', '훌륭', '완벽'];
    const negativeKeywords = ['별로', '실망', '환불', '최악', '불만', '후회'];
    
    return reviews.map(review => {
      const content = review.content.toLowerCase();
      const positiveCount = positiveKeywords.filter(k => content.includes(k)).length;
      const negativeCount = negativeKeywords.filter(k => content.includes(k)).length;
      
      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    });
  }
  
  async analyzeSentiment(reviews) {
    try {
      // AI 분석 시도
      return await this.aiSentimentAnalysis(reviews);
    } catch (error) {
      logger.error('AI analysis failed, using fallback', { error });
      
      // 폴백 로직
      return this.fallbackSentimentAnalysis(reviews);
    }
  }
}
```

### IAM 권한 설정

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4*"
    }
  ]
}
```

### 환경 변수 설정

#### .env.example (템플릿)
```bash
# 개발자 정보
DEVELOPER_NAME=developer1

# 서버 설정
NODE_ENV=development
PORT=3000
CLIENT_PORT=3001

# AI 프로바이더 선택
AI_PROVIDER=local  # 'bedrock', 'claude', 또는 'local'

# AWS Bedrock (프로덕션용)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
BEDROCK_MAX_TOKENS=1000

# Claude API (로컬 개발 - Bedrock 대안)
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=1000

# Ollama (로컬 개발 - 완전 무료)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b  # 또는 gpt-oss
OLLAMA_MAX_TOKENS=1000

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_PORT=8000

# 보안
ALLOWED_ORIGINS=http://localhost:3001

# 로깅
LOG_LEVEL=debug
```

#### .env.local (개발자별 설정)
```bash
# 개발자 1 (Ollama 사용)
DEVELOPER_NAME=developer1
PORT=3000
CLIENT_PORT=3001
DYNAMODB_PORT=8000
OLLAMA_PORT=11434
AI_PROVIDER=local
OLLAMA_MODEL=qwen2.5:7b

# 개발자 2 (Claude API 사용)
DEVELOPER_NAME=developer2
PORT=3010
CLIENT_PORT=3011
DYNAMODB_PORT=8010
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-xxx

# 개발자 3 (AWS Bedrock 사용)
DEVELOPER_NAME=developer3
PORT=3020
CLIENT_PORT=3021
DYNAMODB_PORT=8020
AI_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=actual_key
AWS_SECRET_ACCESS_KEY=actual_secret
```

#### .gitignore 업데이트
```bash
# 환경 변수
.env
.env.local
.env.*.local

# 로컬 데이터
dynamodb-data-*
ollama-data-*

# 로그
logs/
*.log
```

### 성능 모니터링

```javascript
class BedrockService {
  async invoke(prompt) {
    const startTime = Date.now();
    
    try {
      const result = await this.client.send(command);
      const duration = Date.now() - startTime;
      
      logger.info('Bedrock API success', {
        duration,
        inputTokens: prompt.length / 4,  // 대략적인 토큰 수
        model: this.modelId
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Bedrock API failed', { duration, error });
      throw error;
    }
  }
}
```

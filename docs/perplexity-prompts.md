# Perplexity API 프롬프트 템플릿 및 샘플 JSON

## 개요

쇼핑 흑우 감별사에서 사용하는 Perplexity Search API 프롬프트 템플릿과 응답 구조를 정의합니다.

## Perplexity Search API 기본 정보

- **API 엔드포인트**: `https://api.perplexity.ai/search`
- **인증**: Bearer Token (`Authorization: Bearer {API_KEY}`)
- **문서**: https://docs.perplexity.ai/api-reference/search-post

### 주요 파라미터

| 파라미터                | 타입               | 설명                               | 기본값 |
| ----------------------- | ------------------ | ---------------------------------- | ------ |
| `model`                 | string             | 사용할 모델 (예: pplx-7b-online)   | 필수   |
| `query`                 | string or string[] | 검색 쿼리                          | 필수   |
| `max_results`           | number             | 최대 결과 수                       | 10     |
| `country`               | string             | 국가 코드 (예: KR)                 | -      |
| `search_recency_filter` | string             | 검색 기간 (day, week, month, year) | -      |
| `search_domain_filter`  | string[]           | 특정 도메인만 검색                 | -      |

---

## 프롬프트 템플릿

### 1. Product Summary (제품 요약)

**목적**: 제품의 기본 정보, 특징, 평균 가격대, 주요 판매 플랫폼을 수집합니다.

#### 프롬프트 템플릿

```
{productName} 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요. 가격은 원화(KRW)로 표시해주세요.
```

#### 변수

- `productName`: 검색할 제품명

#### 프롬프트 예시

```
삼성 갤럭시 버즈2 프로 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요. 가격은 원화(KRW)로 표시해주세요.
```

#### API 요청 예시

```json
{
  "model": "pplx-7b-online",
  "query": "삼성 갤럭시 버즈2 프로 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요. 가격은 원화(KRW)로 표시해주세요.",
  "max_results": 10,
  "country": "KR",
  "search_recency_filter": "month"
}
```

#### 정규화된 응답 (ProductSummary)

```json
{
  "productName": "삼성 갤럭시 버즈2 프로",
  "averagePrice": 189000,
  "priceRange": {
    "min": 169000,
    "max": 229000
  },
  "popularPlatforms": ["쿠팡", "네이버쇼핑", "11번가"],
  "description": "삼성전자의 프리미엄 완전 무선 이어폰으로, 지능형 ANC와 360 오디오를 지원합니다.",
  "keyFeatures": [
    "지능형 액티브 노이즈 캔슬링 (ANC)",
    "360 오디오 및 헤드 트래킹",
    "IPX7 방수 등급",
    "최대 29시간 재생 (케이스 포함)",
    "듀얼 드라이버 시스템"
  ],
  "searchedAt": "2025-11-22T10:30:00.000Z"
}
```

---

### 2. Price Comparison (가격 비교)

**목적**: 여러 쇼핑몰의 가격 정보를 수집하여 통계를 계산하고 이상치를 탐지합니다.

#### 프롬프트 템플릿

```
{productName} 가격 비교, 쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션 등 주요 쇼핑몰의 최저가 정보를 알려주세요. 가격은 원화(KRW)로 표시해주세요.
```

#### 변수

- `productName`: 검색할 제품명

#### 프롬프트 예시

```
삼성 갤럭시 버즈2 프로 가격 비교, 쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션 등 주요 쇼핑몰의 최저가 정보를 알려주세요. 가격은 원화(KRW)로 표시해주세요.
```

#### API 요청 예시

```json
{
  "model": "pplx-7b-online",
  "query": "삼성 갤럭시 버즈2 프로 가격 비교, 쿠팡, 네이버쇼핑, 11번가, G마켓, 옥션 등 주요 쇼핑몰의 최저가 정보를 알려주세요. 가격은 원화(KRW)로 표시해주세요.",
  "max_results": 15,
  "country": "KR",
  "search_recency_filter": "week",
  "search_domain_filter": [
    "coupang.com",
    "shopping.naver.com",
    "11st.co.kr",
    "gmarket.co.kr",
    "auction.co.kr"
  ]
}
```

#### 정규화된 응답 (PriceComparison)

```json
{
  "productName": "삼성 갤럭시 버즈2 프로",
  "prices": [
    {
      "platform": "쿠팡",
      "price": 169000,
      "url": "https://www.coupang.com/vp/products/123456",
      "seller": "쿠팡",
      "lastUpdated": "2025-11-22"
    },
    {
      "platform": "네이버쇼핑",
      "price": 179900,
      "url": "https://shopping.naver.com/...",
      "seller": "삼성전자 공식스토어",
      "lastUpdated": "2025-11-21"
    },
    {
      "platform": "11번가",
      "price": 185000,
      "url": "https://www.11st.co.kr/...",
      "lastUpdated": "2025-11-20"
    },
    {
      "platform": "G마켓",
      "price": 189000,
      "url": "https://www.gmarket.co.kr/...",
      "lastUpdated": "2025-11-22"
    },
    {
      "platform": "옥션",
      "price": 229000,
      "url": "https://www.auction.co.kr/...",
      "seller": "개인판매자",
      "lastUpdated": "2025-11-19"
    }
  ],
  "statistics": {
    "average": 190380,
    "median": 185000,
    "min": 169000,
    "max": 229000,
    "stdDev": 22145
  },
  "outliers": [
    {
      "platform": "옥션",
      "price": 229000,
      "url": "https://www.auction.co.kr/...",
      "seller": "개인판매자",
      "lastUpdated": "2025-11-19"
    }
  ]
}
```

---

### 3. Review Digest (리뷰 요약)

**목적**: 사용자 리뷰를 분석하여 장단점과 전반적인 감정을 파악합니다.

#### 프롬프트 템플릿

```
{productName} 사용자 리뷰 요약, 장점과 단점, 구매 후기, 전반적인 평가를 한국어로 알려주세요.
```

#### 변수

- `productName`: 검색할 제품명

#### 프롬프트 예시

```
삼성 갤럭시 버즈2 프로 사용자 리뷰 요약, 장점과 단점, 구매 후기, 전반적인 평가를 한국어로 알려주세요.
```

#### API 요청 예시

```json
{
  "model": "pplx-7b-online",
  "query": "삼성 갤럭시 버즈2 프로 사용자 리뷰 요약, 장점과 단점, 구매 후기, 전반적인 평가를 한국어로 알려주세요.",
  "max_results": 10,
  "country": "KR",
  "search_recency_filter": "month"
}
```

#### 정규화된 응답 (ReviewDigest)

```json
{
  "productName": "삼성 갤럭시 버즈2 프로",
  "overallSentiment": "positive",
  "sentimentScore": 78,
  "commonPraises": [
    "노이즈 캔슬링 성능이 매우 뛰어남",
    "음질이 이전 모델보다 훨씬 좋아졌음",
    "착용감이 편안하고 귀에서 잘 빠지지 않음",
    "배터리 수명이 길어서 만족스러움",
    "갤럭시 기기와의 연동이 완벽함"
  ],
  "commonComplaints": [
    "가격이 다소 비싼 편",
    "케이스가 다소 크고 무거움",
    "iOS 기기와 연동 시 일부 기능 제한",
    "간혹 블루투스 연결이 불안정한 경우 발생"
  ],
  "keyInsights": [
    "전반적으로 프리미엄 이어폰에 걸맞은 성능을 보여줌",
    "안드로이드 특히 갤럭시 사용자에게 강력 추천",
    "음질과 ANC는 경쟁 제품 대비 우수하지만 가격도 높은 편",
    "iOS 사용자는 에어팟 프로와 비교 후 선택 권장"
  ],
  "reviewCount": 1247,
  "averageRating": 4.3
}
```

---

### 4. Risk Analysis (위험도 분석)

**목적**: 사기, 불법 판매, 가품 등의 위험 신호를 탐지합니다.

#### 프롬프트 템플릿

```
{productName} 온라인 쇼핑 주의사항, 사기 사례, 가품 판별법, 안전한 구매처를 한국어로 알려주세요.
```

#### 변수

- `productName`: 검색할 제품명

#### 프롬프트 예시

```
삼성 갤럭시 버즈2 프로 온라인 쇼핑 주의사항, 사기 사례, 가품 판별법, 안전한 구매처를 한국어로 알려주세요.
```

#### API 요청 예시

```json
{
  "model": "pplx-7b-online",
  "query": "삼성 갤럭시 버즈2 프로 온라인 쇼핑 주의사항, 사기 사례, 가품 판별법, 안전한 구매처를 한국어로 알려주세요.",
  "max_results": 10,
  "country": "KR",
  "search_recency_filter": "month"
}
```

#### 정규화된 응답 (RiskScore)

```json
{
  "score": 25,
  "level": "LOW",
  "factors": [
    {
      "category": "PRICE",
      "severity": "LOW",
      "description": "가격이 정상 범위 내에 있음",
      "impact": 5
    },
    {
      "category": "SELLER",
      "severity": "LOW",
      "description": "공식 판매처 및 신뢰도 높은 판매자",
      "impact": 8
    },
    {
      "category": "REVIEW",
      "severity": "MEDIUM",
      "description": "일부 부정적 리뷰 존재하나 전반적으로 긍정적",
      "impact": 12
    },
    {
      "category": "PLATFORM",
      "severity": "LOW",
      "description": "대형 쇼핑몰로 구매자 보호 정책 완비",
      "impact": 0
    }
  ],
  "recommendation": "안전한 구매로 판단됩니다. 공식 판매처 또는 신뢰도 높은 판매자를 통해 구매하시면 됩니다."
}
```

---

## Perplexity API 원본 응답 구조

### 기본 응답 형식

```json
{
  "results": [
    {
      "title": "페이지 제목",
      "url": "https://example.com/page",
      "snippet": "검색 결과 요약 텍스트...",
      "date": "2025-11-20",
      "last_updated": "2025-11-22T10:30:00Z"
    }
  ]
}
```

### 실제 응답 예시 (Product Search)

```json
{
  "results": [
    {
      "title": "삼성 갤럭시 버즈2 프로 리뷰: 완벽한 ANC 이어폰",
      "url": "https://www.techreview.com/galaxy-buds2-pro-review",
      "snippet": "삼성전자의 갤럭시 버즈2 프로는 지능형 ANC와 360 오디오를 지원하는 프리미엄 무선 이어폰입니다. 가격은 약 189,000원으로, 경쟁 제품 대비 우수한 음질과 착용감을 자랑합니다.",
      "date": "2025-11-15",
      "last_updated": "2025-11-20T14:30:00Z"
    },
    {
      "title": "갤럭시 버즈2 프로 쿠팡 최저가 169,000원",
      "url": "https://www.coupang.com/vp/products/123456",
      "snippet": "삼성 갤럭시 버즈2 프로를 쿠팡에서 169,000원에 만나보세요. 무료배송, 로켓배송 가능.",
      "date": "2025-11-22"
    },
    {
      "title": "갤럭시 버즈2 프로 vs 에어팟 프로 2 비교",
      "url": "https://www.comparetech.com/buds2-vs-airpods",
      "snippet": "갤럭시 버즈2 프로와 애플 에어팟 프로 2를 음질, ANC, 배터리, 가격 등 다양한 측면에서 비교했습니다. 갤럭시 사용자라면 버즈2 프로를, iOS 사용자라면 에어팟 프로를 추천합니다.",
      "date": "2025-11-10"
    },
    {
      "title": "갤럭시 버즈2 프로 사용자 리뷰 모음",
      "url": "https://shopping.naver.com/reviews/...",
      "snippet": "노이즈 캔슬링이 정말 좋습니다. 음질도 이전 모델보다 훨씬 향상되었어요. 다만 가격이 좀 비싼 편입니다. 평점 4.3/5.0 (1,247개 리뷰)",
      "date": "2025-11-18"
    }
  ]
}
```

---

## 정규화 프로세스

### 1. 가격 추출 로직

```typescript
// 텍스트에서 가격 패턴 매칭
const priceRegex = /(\d{1,3}(,\d{3})*)\s*원/g;

// 예시: "169,000원" → 169000
const matches = text.match(priceRegex);
if (matches) {
  const price = parseInt(matches[0].replace(/[,원]/g, ''));
  // 가격 범위 검증 (1천원 ~ 1억원)
  if (price > 1000 && price < 100000000) {
    prices.push(price);
  }
}
```

### 2. 플랫폼 감지 로직

```typescript
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('coupang')) return '쿠팡';
  if (urlLower.includes('naver')) return '네이버쇼핑';
  if (urlLower.includes('11st')) return '11번가';
  if (urlLower.includes('gmarket')) return 'G마켓';
  if (urlLower.includes('auction')) return '옥션';

  return '기타';
}
```

### 3. 감정 분석 로직

```typescript
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

const negativeKeywords = ['실망', '불만', '최악', '별로', '불편', '느림', '비싸', '고장', '환불'];

// 키워드 빈도 계산
let positiveCount = 0;
let negativeCount = 0;

allText.split(' ').forEach(word => {
  if (positiveKeywords.includes(word)) positiveCount++;
  if (negativeKeywords.includes(word)) negativeCount++;
});

// 감정 점수 계산 (0-100)
const total = positiveCount + negativeCount;
const sentimentScore = total > 0 ? Math.round((positiveCount / total) * 100) : 50;

// 전반적인 감정 분류
let overallSentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
if (sentimentScore >= 70) overallSentiment = 'positive';
else if (sentimentScore <= 30) overallSentiment = 'negative';
else if (Math.abs(positiveCount - negativeCount) < 3) overallSentiment = 'neutral';
else overallSentiment = 'mixed';
```

### 4. 통계 계산 로직

```typescript
// 평균
const average = prices.reduce((a, b) => a + b, 0) / prices.length;

// 중앙값
const sorted = [...prices].sort((a, b) => a - b);
const median =
  sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

// 표준편차
const variance = prices.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / prices.length;
const stdDev = Math.sqrt(variance);

// 이상치 탐지 (평균 ± 2σ 밖)
const outliers = prices.filter(price => Math.abs(price - average) > 2 * stdDev);
```

---

## 프롬프트 최적화 팁

### 1. 구체적인 요청

```
❌ "삼성 갤럭시 버즈2 프로 정보"
✅ "삼성 갤럭시 버즈2 프로 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요."
```

### 2. 단위 명시

```
❌ "가격 알려주세요"
✅ "가격은 원화(KRW)로 표시해주세요"
```

### 3. 검색 범위 제한

```typescript
// 최근 데이터만 검색
search_recency_filter: 'week'; // 또는 'month'

// 특정 도메인만 검색
search_domain_filter: ['coupang.com', 'shopping.naver.com'];
```

### 4. 결과 수 조절

```typescript
// 가격 비교는 많은 결과 필요
max_results: 15; // 가격 비교

// 리뷰 요약은 적은 결과로도 충분
max_results: 10; // 리뷰 요약
```

---

## 에러 처리

### 일반적인 에러

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Missing required parameter: query"
  }
}
```

### 응답 검증

```typescript
function validatePerplexityResponse(response: any): PerplexitySearchResponse {
  if (!response || !Array.isArray(response.results)) {
    throw new Error('Invalid Perplexity response: missing results array');
  }

  if (response.results.length === 0) {
    throw new Error('Perplexity returned no results');
  }

  return response as PerplexitySearchResponse;
}
```

---

## 참고 자료

- [Perplexity API Documentation](https://docs.perplexity.ai/api-reference/search-post)
- [Search Best Practices](https://docs.perplexity.ai/guides/search-best-practices)

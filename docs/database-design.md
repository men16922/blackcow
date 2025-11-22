# DynamoDB 설계 문서

## 개요

쇼핑 흑우 감별사 프로젝트의 DynamoDB 데이터베이스 설계 문서입니다. 세션 관리, 검색 이력, 분석 결과 캐싱을 위한 테이블 구조를 정의합니다.

## 테이블 설계

### 1. SearchSessions 테이블

사용자의 제품 분석 세션을 추적하고 결과를 저장합니다.

#### 키 스키마

| 속성 | 타입 | 키 타입 | 설명 |
|------|------|---------|------|
| sessionId | String | HASH (PK) | UUID v4 형식의 세션 고유 ID |
| createdAt | String | RANGE (SK) | ISO 8601 형식의 생성 시간 |

#### Global Secondary Index (GSI)

**ProductNameIndex**
- Partition Key: `productName` (String)
- Sort Key: `createdAt` (String)
- 목적: 특정 제품에 대한 모든 세션 조회

#### 속성

| 속성 | 타입 | 필수 | 설명 |
|------|------|------|------|
| sessionId | String | ✅ | 세션 고유 ID (UUID v4) |
| createdAt | String | ✅ | 세션 생성 시간 (ISO 8601) |
| productName | String | ✅ | 분석 대상 제품명 |
| productUrl | String | ❌ | 원본 제품 URL |
| status | String | ✅ | 세션 상태: `pending`, `analyzing`, `completed`, `failed` |
| analysisResult | Object | ❌ | 분석 결과 (ProductAnalysisResult) |
| errorMessage | String | ❌ | 실패 시 에러 메시지 |
| updatedAt | String | ✅ | 마지막 업데이트 시간 (ISO 8601) |
| userAgent | String | ❌ | 사용자 브라우저 정보 |
| ipAddress | String | ❌ | 사용자 IP 주소 |
| userId | String | ❌ | 향후 사용자 인증 추가 시 사용 |
| ttl | Number | ❌ | TTL (Unix timestamp, 초 단위) - 30일 후 자동 삭제 |

#### 데이터 예시

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2025-11-22T10:30:00.000Z",
  "productName": "삼성 갤럭시 버즈2 프로",
  "productUrl": "https://www.coupang.com/vp/products/123456",
  "status": "completed",
  "analysisResult": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "삼성 갤럭시 버즈2 프로",
    "summary": { /* ... */ },
    "priceComparison": { /* ... */ },
    "reviewDigest": { /* ... */ },
    "riskScore": { /* ... */ },
    "analyzedAt": "2025-11-22T10:30:15.000Z",
    "processingTime": 8500
  },
  "updatedAt": "2025-11-22T10:30:15.000Z",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1",
  "ttl": 1735209015
}
```

#### 접근 패턴

1. **세션 ID로 조회**: `GetItem` with PK = sessionId
2. **제품명으로 모든 세션 조회**: `Query` on ProductNameIndex
3. **최근 세션 목록**: `Scan` with filter (비효율적, 향후 개선 필요)

---

### 2. SearchHistory 테이블

Perplexity API 호출 이력을 저장합니다. 각 세션은 여러 검색 이력을 가질 수 있습니다.

#### 키 스키마

| 속성 | 타입 | 키 타입 | 설명 |
|------|------|---------|------|
| historyId | String | HASH (PK) | UUID v4 형식의 이력 고유 ID |
| createdAt | String | RANGE (SK) | ISO 8601 형식의 생성 시간 |

#### Global Secondary Indexes (GSI)

**SessionIndex**
- Partition Key: `sessionId` (String)
- Sort Key: `createdAt` (String)
- 목적: 특정 세션의 모든 검색 이력 조회

**SearchTypeIndex**
- Partition Key: `searchType` (String)
- Sort Key: `createdAt` (String)
- 목적: 검색 타입별 통계 및 분석

#### 속성

| 속성 | 타입 | 필수 | 설명 |
|------|------|------|------|
| historyId | String | ✅ | 이력 고유 ID (UUID v4) |
| createdAt | String | ✅ | 생성 시간 (ISO 8601) |
| sessionId | String | ✅ | 관련 세션 ID |
| productName | String | ✅ | 검색한 제품명 |
| searchType | String | ✅ | 검색 타입: `product`, `price`, `review`, `risk` |
| query | String | ✅ | Perplexity에 전송한 실제 쿼리 |
| response | Object | ✅ | Perplexity 원본 응답 (PerplexitySearchResponse) |
| processingTime | Number | ✅ | 처리 시간 (밀리초) |
| success | Boolean | ✅ | 성공 여부 |
| errorMessage | String | ❌ | 실패 시 에러 메시지 |
| ttl | Number | ❌ | TTL (Unix timestamp, 초 단위) - 90일 후 자동 삭제 |

#### 데이터 예시

```json
{
  "historyId": "660f9511-f3ac-52e5-b827-557766551111",
  "createdAt": "2025-11-22T10:30:05.000Z",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "productName": "삼성 갤럭시 버즈2 프로",
  "searchType": "product",
  "query": "삼성 갤럭시 버즈2 프로 제품 정보, 주요 특징, 평균 가격대, 인기 판매 플랫폼을 한국어로 요약해주세요.",
  "response": {
    "results": [
      {
        "title": "삼성 갤럭시 버즈2 프로 리뷰...",
        "url": "https://example.com/...",
        "snippet": "...",
        "date": "2025-11-20"
      }
    ]
  },
  "processingTime": 2500,
  "success": true,
  "ttl": 1742889015
}
```

#### 접근 패턴

1. **세션의 모든 검색 이력 조회**: `Query` on SessionIndex with PK = sessionId
2. **검색 타입별 통계**: `Query` on SearchTypeIndex with PK = searchType
3. **이력 ID로 조회**: `GetItem` with PK = historyId

---

### 3. AnalysisCache 테이블

제품 분석 결과를 캐싱하여 동일한 제품에 대한 반복 분석을 방지합니다.

#### 키 스키마

| 속성 | 타입 | 키 타입 | 설명 |
|------|------|---------|------|
| cacheKey | String | HASH (PK) | hash(productName + version) |
| productName | String | RANGE (SK) | 제품명 |

#### Global Secondary Index (GSI)

**ExpiresAtIndex**
- Partition Key: `expiresAt` (String)
- 목적: 만료된 캐시 항목 정리 (배치 작업)

#### 속성

| 속성 | 타입 | 필수 | 설명 |
|------|------|------|------|
| cacheKey | String | ✅ | 캐시 키 (productName + version의 해시) |
| productName | String | ✅ | 제품명 |
| analysisResult | Object | ✅ | 분석 결과 (ProductAnalysisResult) |
| createdAt | String | ✅ | 생성 시간 (ISO 8601) |
| expiresAt | String | ✅ | 만료 시간 (ISO 8601, 24시간 후) |
| hitCount | Number | ✅ | 캐시 히트 횟수 |
| lastAccessedAt | String | ✅ | 마지막 접근 시간 (ISO 8601) |
| version | String | ✅ | 분석 알고리즘 버전 (예: "1.0.0") |
| ttl | Number | ✅ | TTL (Unix timestamp, 초 단위) |

#### 데이터 예시

```json
{
  "cacheKey": "a1b2c3d4e5f6g7h8i9j0",
  "productName": "삼성 갤럭시 버즈2 프로",
  "analysisResult": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "productName": "삼성 갤럭시 버즈2 프로",
    "summary": { /* ... */ },
    "priceComparison": { /* ... */ },
    "reviewDigest": { /* ... */ },
    "riskScore": {
      "score": 25,
      "level": "LOW",
      "factors": [],
      "recommendation": "안전한 구매로 판단됩니다."
    },
    "analyzedAt": "2025-11-22T10:30:15.000Z",
    "processingTime": 8500
  },
  "createdAt": "2025-11-22T10:30:15.000Z",
  "expiresAt": "2025-11-23T10:30:15.000Z",
  "hitCount": 5,
  "lastAccessedAt": "2025-11-22T15:20:00.000Z",
  "version": "1.0.0",
  "ttl": 1732282215
}
```

#### 접근 패턴

1. **캐시 키로 조회**: `GetItem` with PK = cacheKey
2. **제품명으로 조회**: `Query` with PK = cacheKey, SK = productName (정확한 키 필요)
3. **만료된 캐시 정리**: `Query` on ExpiresAtIndex with filter

#### 캐시 키 생성 로직

```typescript
import crypto from 'crypto';

function generateCacheKey(productName: string, version: string): string {
  const data = `${productName.toLowerCase().trim()}:${version}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
}
```

---

## TTL 설정

DynamoDB의 TTL(Time To Live) 기능을 사용하여 오래된 데이터를 자동으로 삭제합니다.

### TTL 정책

| 테이블 | TTL 기간 | 용도 |
|--------|----------|------|
| SearchSessions | 30일 | 세션 데이터는 통계 분석 후 삭제 |
| SearchHistory | 90일 | 검색 이력은 더 긴 기간 보관 |
| AnalysisCache | 24시간 | 캐시는 짧은 기간 유지 |

### TTL 계산 예시

```typescript
// 현재 시간 기준 30일 후
const ttl30Days = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

// 현재 시간 기준 90일 후
const ttl90Days = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

// 현재 시간 기준 24시간 후
const ttl24Hours = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
```

---

## 인덱스 설계 이유

### ProductNameIndex (SearchSessions)

**사용 사례**: 특정 제품에 대한 모든 분석 세션 조회
- 제품 인기도 분석
- 사용자들이 많이 검색하는 제품 파악
- 제품별 분석 추이 확인

### SessionIndex (SearchHistory)

**사용 사례**: 특정 세션의 모든 검색 이력 조회
- 세션 디버깅
- 사용자 행동 분석
- 검색 과정 추적

### SearchTypeIndex (SearchHistory)

**사용 사례**: 검색 타입별 통계 및 분석
- API 사용량 모니터링 (타입별)
- 성능 최적화 대상 파악
- 비용 분석

### ExpiresAtIndex (AnalysisCache)

**사용 사례**: 만료된 캐시 항목 정리
- 배치 작업을 통한 주기적 정리
- 스토리지 비용 절감

---

## 데이터 플로우

### 1. 제품 분석 요청 플로우

```
1. Client → POST /api/analyze { productName: "..." }

2. Server:
   a. 새 SearchSession 생성 (status: "pending")
   b. AnalysisCache 확인
      - 캐시 있음: 캐시 반환, hitCount++, lastAccessedAt 업데이트
      - 캐시 없음: 다음 단계 진행

3. Perplexity API 호출 (순차):
   a. Product Search → SearchHistory 저장 (searchType: "product")
   b. Price Search → SearchHistory 저장 (searchType: "price")
   c. Review Search → SearchHistory 저장 (searchType: "review")

4. Risk Analysis:
   - 수집된 데이터 기반 BRS 점수 계산
   - SearchHistory 저장 (searchType: "risk")

5. 결과 저장:
   a. SearchSession 업데이트 (status: "completed", analysisResult)
   b. AnalysisCache 저장 (24시간 TTL)

6. Client ← 분석 결과 반환
```

### 2. 캐시 히트 플로우

```
1. Client → POST /api/analyze { productName: "..." }

2. Server:
   a. 새 SearchSession 생성 (status: "pending")
   b. cacheKey = hash(productName + version)
   c. AnalysisCache.GetItem(cacheKey)

3. 캐시 발견:
   a. hitCount++ 업데이트
   b. lastAccessedAt 업데이트
   c. 즉시 반환 (Perplexity API 호출 X)

4. SearchSession 업데이트 (status: "completed", analysisResult)

5. Client ← 캐시된 결과 반환 (매우 빠름)
```

---

## 비용 최적화

### 1. On-Demand vs Provisioned

현재 설계는 **On-Demand** 방식을 권장합니다.

**이유**:
- 트래픽이 예측 불가능
- 초기 단계에서는 사용량이 적음
- 스파이크 트래픽 대응 필요

**향후**: 트래픽이 안정화되면 Provisioned로 전환 고려

### 2. 인덱스 최적화

- GSI는 필요한 속성만 프로젝션 (`KEYS_ONLY` or `INCLUDE`)
- 현재는 `ALL` 프로젝션 사용 (간편성 우선)

### 3. TTL 활용

- 자동 삭제를 통한 스토리지 비용 절감
- 수동 삭제 배치 작업 불필요

---

## 향후 확장 계획

### 1. 사용자 인증 추가

```typescript
// SearchSession에 userId 추가
interface SearchSession {
  userId?: string; // Cognito User Pool ID
  // ...
}
```

**새 GSI**: UserIndex (userId, createdAt)

### 2. 제품 즐겨찾기

새 테이블: `UserFavorites`

```typescript
interface UserFavorite {
  userId: string; // PK
  productName: string; // SK
  addedAt: string;
  lastViewedAt: string;
}
```

### 3. 알림 설정

새 테이블: `PriceAlerts`

```typescript
interface PriceAlert {
  alertId: string; // PK
  userId: string; // GSI PK
  productName: string;
  targetPrice: number;
  createdAt: string;
  active: boolean;
}
```

---

## 테이블 생성 스크립트

### AWS CLI를 이용한 테이블 생성

```bash
# SearchSessions 테이블
aws dynamodb create-table \
  --table-name SearchSessions \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=productName,AttributeType=S \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --global-secondary-indexes \
    '[{
      "IndexName": "ProductNameIndex",
      "KeySchema": [
        {"AttributeName": "productName", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }]' \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --tags Key=Project,Value=ShoppingFraudDetector

# SearchHistory 테이블
aws dynamodb create-table \
  --table-name SearchHistory \
  --attribute-definitions \
    AttributeName=historyId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=searchType,AttributeType=S \
  --key-schema \
    AttributeName=historyId,KeyType=HASH \
    AttributeName=createdAt,KeyType=RANGE \
  --global-secondary-indexes \
    '[{
      "IndexName": "SessionIndex",
      "KeySchema": [
        {"AttributeName": "sessionId", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "SearchTypeIndex",
      "KeySchema": [
        {"AttributeName": "searchType", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }]' \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=ShoppingFraudDetector

# AnalysisCache 테이블
aws dynamodb create-table \
  --table-name AnalysisCache \
  --attribute-definitions \
    AttributeName=cacheKey,AttributeType=S \
    AttributeName=productName,AttributeType=S \
    AttributeName=expiresAt,AttributeType=S \
  --key-schema \
    AttributeName=cacheKey,KeyType=HASH \
    AttributeName=productName,KeyType=RANGE \
  --global-secondary-indexes \
    '[{
      "IndexName": "ExpiresAtIndex",
      "KeySchema": [
        {"AttributeName": "expiresAt", "KeyType": "HASH"}
      ],
      "Projection": {"ProjectionType": "KEYS_ONLY"}
    }]' \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=ShoppingFraudDetector

# TTL 설정 (각 테이블마다)
aws dynamodb update-time-to-live \
  --table-name SearchSessions \
  --time-to-live-specification Enabled=true,AttributeName=ttl

aws dynamodb update-time-to-live \
  --table-name SearchHistory \
  --time-to-live-specification Enabled=true,AttributeName=ttl

aws dynamodb update-time-to-live \
  --table-name AnalysisCache \
  --time-to-live-specification Enabled=true,AttributeName=ttl
```

---

## 참고 자료

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [Global Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)

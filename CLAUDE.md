# 쇼핑 흑우 감별사 - 프로젝트 가이드

## 프로젝트 개요

AI 기반 온라인 쇼핑 사기 탐지 서비스입니다. 상품 URL을 분석하여 BRS(Black Cow Risk Score) 점수를 제공하고, 사기 위험도를 평가합니다.

## 기술 스택

### 모노레포 관리
- **Yarn Workspaces**: 패키지 의존성 관리
- **concurrently**: 병렬 실행 도구

### 프론트엔드 (apps/client)
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구 및 개발 서버
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **React Router**: 클라이언트 사이드 라우팅
- **Axios**: HTTP 클라이언트

### 백엔드 (apps/server)
- **Node.js 20.18.1+**: 런타임
- **Express**: 웹 프레임워크
- **TypeScript**: 타입 안정성
- **Winston**: 로깅
- **Helmet**: 보안 미들웨어
- **express-rate-limit**: API 속도 제한
- **AWS SDK**: DynamoDB 클라이언트
- **Anthropic SDK**: Claude API 클라이언트
- **Cheerio**: HTML 파싱 및 크롤링

### 공유 패키지 (packages/)
- **@shopping-fraud-detector/shared**: 공통 타입 및 유틸리티

## 프로젝트 구조

```
shopping-fraud-detector/
├── apps/
│   ├── client/              # React 프론트엔드
│   │   ├── src/
│   │   │   ├── components/  # 재사용 가능한 UI 컴포넌트
│   │   │   ├── pages/       # 페이지 컴포넌트
│   │   │   ├── services/    # API 클라이언트
│   │   │   ├── App.tsx      # 메인 앱 컴포넌트
│   │   │   └── main.tsx     # 엔트리 포인트
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── server/              # Express 백엔드
│       ├── src/
│       │   ├── routes/      # API 라우트
│       │   ├── services/    # 비즈니스 로직
│       │   ├── models/      # 데이터 모델
│       │   ├── db/          # DynamoDB 클라이언트
│       │   ├── middleware/  # Express 미들웨어
│       │   ├── utils/       # 유틸리티 함수
│       │   └── index.ts     # 서버 엔트리 포인트
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/              # 공통 코드
│       ├── src/
│       │   ├── types/       # TypeScript 타입 정의
│       │   └── utils/       # 공통 유틸리티
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                    # 문서
├── .github/                 # GitHub Actions 워크플로우
│   ├── workflows/           # CI/CD 워크플로우
│   ├── ISSUE_TEMPLATE/      # Issue 템플릿
│   └── pull_request_template.md  # PR 템플릿
├── scripts/                 # 유틸리티 스크립트
│   ├── deploy.sh            # 배포 스크립트
│   ├── setup-db.sh          # 데이터베이스 초기화
│   └── backup.sh            # 백업 스크립트
├── infra/                   # 인프라 코드 (IaC)
│   ├── terraform/           # Terraform 설정
│   ├── docker/              # Docker 설정
│   └── lightsail/           # AWS Lightsail 설정
├── tsconfig.json            # TypeScript 설정
├── .eslintrc.js             # ESLint 설정
├── .prettierrc              # Prettier 설정
├── package.json             # 루트 패키지 설정 (Yarn Workspaces)
└── README.md                # 프로젝트 문서
```

## 개발 시작하기

### 1. 의존성 설치

```bash
yarn install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 환경 변수를 설정합니다:

```bash
# AI Provider 선택 (claude 권장)
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-your-key-here

# 포트 설정
PORT=3000
CLIENT_PORT=3001

# DynamoDB (로컬 개발)
DYNAMODB_ENDPOINT=http://localhost:8000
```

### 3. Docker 서비스 시작 (선택사항)

로컬 DynamoDB가 필요한 경우:

```bash
docker-compose -f docker-compose.local.yml up -d
```

### 4. 개발 서버 실행

```bash
# 모든 앱 동시 실행 (concurrently로 병렬 실행)
yarn dev

# 또는 개별 실행
yarn workspace @shopping-fraud-detector/client dev
yarn workspace @shopping-fraud-detector/server dev
```

- Client: http://localhost:3001
- Server: http://localhost:3000

## Yarn Workspaces 명령어

### 개발

```bash
yarn dev              # 모든 앱의 개발 서버 시작
yarn build            # 모든 앱 빌드
yarn test             # 모든 앱 테스트 실행
yarn lint             # 모든 앱 린트 실행
yarn format           # Prettier로 코드 포맷팅
```

### 특정 워크스페이스 실행

```bash
yarn workspace @shopping-fraud-detector/client <script>
yarn workspace @shopping-fraud-detector/server <script>
yarn workspace @shopping-fraud-detector/shared <script>
```

### 전체 워크스페이스 실행

```bash
# 모든 워크스페이스에서 동일한 스크립트 실행
yarn workspaces run <script>

# 예시
yarn workspaces run test
yarn workspaces run lint
```

## 주요 기능 구현 상태

### Phase 1 (MVP) - 🚧 진행 중
- ✅ 프로젝트 구조 세팅 (Turborepo)
- ⏳ 상품 크롤링 (쿠팡, 네이버쇼핑, 11번가)
- ⏳ 가격 분석 (Median + MAD 기반 이상치 탐지)
- ⏳ 판매자 신뢰도 평가
- ⏳ 리뷰 분석 (AI 기반)
- ⏳ BRS 점수 계산
- ⏳ 대안 상품 추천

### Phase 2 - 📋 계획
- AI 추천 코멘트
- 리뷰 감정 지도
- 위험 키워드 감지
- 리스크 타임라인

### Phase 3 - 📋 계획
- 상품 비교 기능
- PDF 리포트 생성
- 사용자 참여형 DB

## API 엔드포인트

### POST /api/analyze
상품 URL을 분석하여 BRS 점수 반환

**Request:**
```json
{
  "url": "https://www.coupang.com/vp/products/123456"
}
```

**Response:**
```json
{
  "brs": 65,
  "riskLevel": "HIGH",
  "reasonCodes": ["PRICE_OUTLIER", "REVIEW_ABUSING"],
  "analyses": { ... },
  "recommendations": [ ... ],
  "analyzedAt": "2025-11-01T12:00:00Z",
  "processingTime": 8500
}
```

### GET /api/alternatives
대안 상품 검색

**Query Parameters:**
- `productName`: 상품명 (required)

## 코딩 가이드라인

### TypeScript

**기본 원칙**
- 모든 코드는 TypeScript로 작성
- `any` 타입 사용 지양 (`unknown` 사용 권장)
- 공통 타입은 `packages/shared/src/types`에 정의
- 엄격 모드 활성화 (`strict: true`)

**타입 정의**
```typescript
// ✅ 좋은 예시
interface Product {
  id: string;
  name: string;
  price: number;
  seller: Seller;
}

type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

// ❌ 나쁜 예시
interface Product {
  id: any;  // any 사용 지양
  data: object;  // 구체적인 타입 명시 필요
}
```

**제네릭 활용**
```typescript
// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 사용
const response: ApiResponse<AnalysisResult> = await analyzeProduct(url);
```

**유틸리티 타입 활용**
```typescript
type PartialProduct = Partial<Product>;
type ReadonlyProduct = Readonly<Product>;
type ProductKeys = keyof Product;
```

### 네이밍 컨벤션

**파일 및 디렉토리**
```
apps/client/src/
├── components/
│   ├── ProductCard.tsx          # PascalCase (React 컴포넌트)
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Input.tsx
├── pages/
│   ├── HomePage.tsx
│   └── AnalysisPage.tsx
├── services/
│   ├── api-client.ts            # kebab-case (유틸리티, 서비스)
│   ├── product-service.ts
│   └── auth-service.ts
├── hooks/
│   ├── useProductAnalysis.ts    # camelCase with 'use' prefix
│   └── useAuth.ts
├── utils/
│   ├── date-formatter.ts        # kebab-case
│   └── string-helpers.ts
└── types/
    ├── product.types.ts         # kebab-case with .types suffix
    └── api.types.ts
```

**변수 및 함수**
```typescript
// ✅ 좋은 예시

// 변수: camelCase
const productList = [];
const analysisResult = {};
let isLoading = false;

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

// 함수: camelCase (동사로 시작)
function analyzeProduct(url: string) { }
function calculateBRS(data: ProductData) { }
async function fetchProductData(id: string) { }

// Boolean 변수/함수: is/has/should 접두사
const isValid = true;
const hasError = false;
function shouldRetry() { return true; }

// 이벤트 핸들러: handle 접두사
function handleSubmit(e: Event) { }
function handleProductClick(id: string) { }

// ❌ 나쁜 예시
const ProductList = [];  // 변수는 camelCase
const api_url = '';      // camelCase 사용
function AnalyzeProduct() { }  // 함수는 camelCase
```

**타입 및 인터페이스**
```typescript
// PascalCase
interface ProductAnalysis { }
type AnalysisResult = { };
enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Props 타입: 컴포넌트명 + Props
interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
}
```

**클래스**
```typescript
// PascalCase
class ProductAnalyzer {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async analyze(url: string): Promise<AnalysisResult> {
    // ...
  }
}
```

### 코드 스타일

**Prettier 설정** (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

**ESLint 규칙**
- `no-console`: warn (프로덕션에서는 logger 사용)
- `no-unused-vars`: error
- `@typescript-eslint/no-explicit-any`: error
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn

**Import 순서**
```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal packages
import { AnalysisResult } from '@shopping-fraud-detector/shared';

// 3. Relative imports (상위 디렉토리)
import { ApiClient } from '../../services/api-client';

// 4. Relative imports (같은 레벨)
import { ProductCard } from './ProductCard';

// 5. Styles
import './styles.css';
```

**주석 작성**
```typescript
/**
 * 상품 URL을 분석하여 BRS 점수를 계산합니다.
 *
 * @param url - 분석할 상품 URL
 * @param options - 분석 옵션
 * @returns BRS 점수 및 분석 결과
 * @throws {InvalidUrlError} URL이 유효하지 않은 경우
 *
 * @example
 * const result = await analyzeProduct('https://example.com/product/123');
 * console.log(result.brs); // 65
 */
async function analyzeProduct(
  url: string,
  options?: AnalysisOptions
): Promise<AnalysisResult> {
  // 구현...
}

// ✅ 복잡한 로직에는 설명 주석
// BRS 점수는 가격(40%), 판매자(30%), 리뷰(30%) 가중치로 계산
const brs = (priceScore * 0.4) + (sellerScore * 0.3) + (reviewScore * 0.3);

// ❌ 자명한 코드에는 주석 불필요
// i를 1 증가시킴
i++;
```

**함수 길이 및 복잡도**
- 함수는 한 가지 일만 수행 (Single Responsibility)
- 최대 50줄 이하 권장
- 중첩된 if 문은 3단계 이하
- 복잡한 로직은 별도 함수로 분리

```typescript
// ❌ 나쁜 예시 (너무 긴 함수)
async function analyzeProduct(url: string) {
  // 100줄 이상의 코드...
}

// ✅ 좋은 예시 (역할 분리)
async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const productData = await fetchProductData(url);
  const priceAnalysis = analyzePriceData(productData.prices);
  const sellerAnalysis = analyzeSellerData(productData.seller);
  const reviewAnalysis = await analyzeReviews(productData.reviews);

  return calculateBRS({
    price: priceAnalysis,
    seller: sellerAnalysis,
    review: reviewAnalysis,
  });
}
```

### React 컴포넌트 작성 가이드

**컴포넌트 구조**
```tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { Product } from '@shopping-fraud-detector/shared';

// Props 인터페이스 정의
interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * 상품 정보를 표시하는 카드 컴포넌트
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  className = '',
}) => {
  // State
  const [isHovered, setIsHovered] = useState(false);

  // Effects
  useEffect(() => {
    // 부수 효과
  }, []);

  // Handlers
  const handleClick = useCallback(() => {
    onSelect?.(product.id);
  }, [onSelect, product.id]);

  // Render
  return (
    <div
      className={`product-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3>{product.name}</h3>
      <p>{product.price.toLocaleString()}원</p>
    </div>
  );
};
```

**Hooks 사용 규칙**
```typescript
// ✅ 좋은 예시
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// 의존성 배열 명시
useEffect(() => {
  fetchData();
}, [fetchData]);

// useCallback으로 함수 메모이제이션
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

// useMemo로 비용이 큰 계산 메모이제이션
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// ❌ 나쁜 예시
useEffect(() => {
  fetchData();
}, []); // fetchData가 의존성에 없음 (ESLint 경고)
```

### 에러 처리

**프론트엔드**
```typescript
try {
  const result = await api.analyzeProduct(url);
  setAnalysisResult(result);
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message);
  } else if (error instanceof Error) {
    setError('예상치 못한 오류가 발생했습니다.');
    console.error('Unexpected error:', error);
  } else {
    setError('알 수 없는 오류가 발생했습니다.');
  }
} finally {
  setLoading(false);
}
```

**백엔드**
```typescript
import { Request, Response, NextFunction } from 'express';

// 커스텀 에러 클래스
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 에러 핸들러 미들웨어
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
  });
};
```

### 환경 변수 관리

**타입 안전한 환경 변수**
```typescript
// apps/server/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  CLAUDE_API_KEY: z.string().min(1),
  DYNAMODB_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);

// 사용
import { env } from './config/env';
console.log(env.PORT); // 타입 안전 (number)
```

### 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/) 형식 사용:

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 변경 (포맷팅)
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 도구 변경
```

예시:
```
feat(server): 상품 크롤링 기능 구현
fix(client): 분석 결과 페이지 렌더링 오류 수정
docs: README에 환경 설정 가이드 추가
```

## 테스트

### 단위 테스트

```bash
yarn test
```

### 특정 패키지 테스트

```bash
yarn workspace @shopping-fraud-detector/server test
```

### 통합 테스트

```bash
yarn test:integration
```

### 커버리지

```bash
yarn test:coverage
```

## 배포

### AWS Lightsail 배포

상세 가이드는 [README.md](./README.md#-배포) 참조

## 인프라 및 DevOps

### 디렉토리 구조

```
infra/
├── terraform/           # Terraform IaC
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── docker/             # Docker 설정
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── docker-compose.yml
└── lightsail/          # AWS Lightsail 설정
    └── setup.sh

scripts/
├── deploy.sh           # 배포 스크립트
├── setup-db.sh         # DynamoDB 초기화
├── backup.sh           # 백업 스크립트
└── health-check.sh     # 헬스체크
```

### 스크립트 작성 가이드

**배포 스크립트 예시** (`scripts/deploy.sh`)
```bash
#!/bin/bash
set -e  # 에러 발생 시 즉시 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 환경 변수 체크
check_env() {
    if [ -z "$CLAUDE_API_KEY" ]; then
        log_error "CLAUDE_API_KEY is not set"
        exit 1
    fi
    log_info "Environment variables validated"
}

# 의존성 설치
install_dependencies() {
    log_info "Installing dependencies..."
    yarn install --frozen-lockfile
}

# 빌드
build() {
    log_info "Building applications..."
    yarn build

    if [ $? -eq 0 ]; then
        log_info "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# 배포 실행
deploy() {
    log_info "Deploying to AWS Lightsail..."
    # 배포 로직
}

# 메인 실행
main() {
    log_info "Starting deployment process..."
    check_env
    install_dependencies
    build
    deploy
    log_info "Deployment completed!"
}

main "$@"
```

**데이터베이스 초기화** (`scripts/setup-db.sh`)
```bash
#!/bin/bash
set -e

# DynamoDB 테이블 생성
create_tables() {
    aws dynamodb create-table \
        --table-name Products \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=url,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            '[
                {
                    "IndexName": "UrlIndex",
                    "KeySchema": [{"AttributeName":"url","KeyType":"HASH"}],
                    "Projection": {"ProjectionType":"ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                }
            ]' \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --endpoint-url http://localhost:8000

    echo "DynamoDB tables created successfully"
}

create_tables
```

**헬스체크** (`scripts/health-check.sh`)
```bash
#!/bin/bash

# 서버 헬스체크
check_server() {
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

    if [ "$response" -eq 200 ]; then
        echo "✅ Server is healthy"
        return 0
    else
        echo "❌ Server is unhealthy (HTTP $response)"
        return 1
    fi
}

# DynamoDB 연결 체크
check_dynamodb() {
    aws dynamodb list-tables --endpoint-url http://localhost:8000 > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ DynamoDB is connected"
        return 0
    else
        echo "❌ DynamoDB connection failed"
        return 1
    fi
}

# 전체 헬스체크
main() {
    echo "Running health checks..."

    check_server
    server_status=$?

    check_dynamodb
    db_status=$?

    if [ $server_status -eq 0 ] && [ $db_status -eq 0 ]; then
        echo "✅ All systems operational"
        exit 0
    else
        echo "❌ System check failed"
        exit 1
    fi
}

main
```

### Docker 설정

**프론트엔드 Dockerfile** (`infra/docker/Dockerfile.client`)
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package.json yarn.lock ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/
RUN yarn install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN yarn workspace @shopping-fraud-detector/client build

# 프로덕션 이미지
FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**백엔드 Dockerfile** (`infra/docker/Dockerfile.server`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package.json yarn.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN yarn install --frozen-lockfile --production

# 소스 복사
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# 빌드
RUN yarn workspace @shopping-fraud-detector/server build

# 환경 변수
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/server/dist/index.js"]
```

**Docker Compose** (`infra/docker/docker-compose.yml`)
```yaml
version: '3.8'

services:
  client:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.client
    ports:
      - "3001:80"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - server

  server:
    build:
      context: ../..
      dockerfile: infra/docker/Dockerfile.server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
    depends_on:
      - dynamodb
    restart: unless-stopped

  dynamodb:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
    volumes:
      - dynamodb-data:/data
    restart: unless-stopped

volumes:
  dynamodb-data:
```

### Terraform 설정 (선택사항)

**메인 설정** (`infra/terraform/main.tf`)
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Lightsail Instance
resource "aws_lightsail_instance" "app_server" {
  name              = "shopping-fraud-detector"
  availability_zone = "${var.aws_region}a"
  blueprint_id      = "nodejs_16"
  bundle_id         = "nano_2_0"

  tags = {
    Environment = var.environment
    Project     = "shopping-fraud-detector"
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "products" {
  name           = "Products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "url"
    type = "S"
  }

  global_secondary_index {
    name            = "UrlIndex"
    hash_key        = "url"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "shopping-fraud-detector"
  }
}
```

**변수 정의** (`infra/terraform/variables.tf`)
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "claude_api_key" {
  description = "Claude API key"
  type        = string
  sensitive   = true
}
```

### GitHub Actions 워크플로우

**CI/CD 파이프라인** (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run tests
        run: yarn test

      - name: Build
        run: yarn build

      - name: Deploy to Lightsail
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: |
          chmod +x scripts/deploy.sh
          ./scripts/deploy.sh
```

### 스크립트 실행 권한

스크립트 파일은 실행 권한이 필요합니다:

```bash
# 실행 권한 부여
chmod +x scripts/*.sh

# 스크립트 실행
./scripts/deploy.sh
./scripts/health-check.sh
```

### 환경별 설정

**개발 환경** (`.env.development`)
```bash
NODE_ENV=development
PORT=3000
CLIENT_PORT=3001
DYNAMODB_ENDPOINT=http://localhost:8000
CLAUDE_API_KEY=your-dev-key
LOG_LEVEL=debug
```

**프로덕션 환경** (`.env.production`)
```bash
NODE_ENV=production
PORT=3000
DYNAMODB_ENDPOINT=https://dynamodb.ap-northeast-2.amazonaws.com
CLAUDE_API_KEY=your-prod-key
LOG_LEVEL=info
```

## 트러블슈팅

### 포트 충돌

여러 개발자가 동시에 작업할 경우 `.env.local`에서 포트 변경:

```bash
PORT=3010
CLIENT_PORT=3011
DYNAMODB_PORT=8010
```

### 빌드 문제

예상치 못한 빌드 문제가 발생하면 클린 빌드:

```bash
yarn clean
yarn install
yarn build
```

### 타입 에러

공유 타입이 업데이트된 경우 shared 패키지 재빌드:

```bash
yarn workspace @shopping-fraud-detector/shared build
```

## 유용한 리소스

- [Turborepo 문서](https://turbo.build/repo/docs)
- [React 문서](https://react.dev/)
- [Express 문서](https://expressjs.com/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [AWS DynamoDB](https://docs.aws.amazon.com/dynamodb/)

## 팀 협업

### 브랜치 전략 (Git Flow)

프로젝트는 Git Flow 기반 브랜치 전략을 사용합니다.

#### 주요 브랜치

- **`main`**: 프로덕션 배포 브랜치
  - 항상 배포 가능한 상태 유지
  - 직접 커밋 금지 (PR을 통해서만 머지)
  - 태그를 통한 버전 관리 (예: `v1.0.0`)

- **`develop`**: 개발 통합 브랜치
  - 다음 릴리스를 위한 개발 작업 통합
  - 모든 기능 브랜치의 베이스
  - 정기적으로 main에 머지 (릴리스 시)

#### 보조 브랜치

브랜치 명명 규칙: `<type>/<description>`

**기능 개발**
```bash
feature/<기능명>
# 예시:
feature/product-crawling
feature/brs-calculation
feature/ai-review-analysis
```
- `develop`에서 분기
- `develop`으로 머지
- 완료 후 브랜치 삭제

**버그 수정**
```bash
fix/<버그명>
# 예시:
fix/login-error
fix/dynamodb-query
fix/infinite-loading
```
- `develop`에서 분기 (일반 버그)
- `main`에서 분기 (핫픽스)
- 원래 브랜치로 머지

**리팩토링**
```bash
refactor/<대상>
# 예시:
refactor/api-structure
refactor/component-hierarchy
```

**문서 작업**
```bash
docs/<문서명>
# 예시:
docs/api-guide
docs/deployment
```

**실험/연구**
```bash
experiment/<실험명>
# 예시:
experiment/price-algorithm
experiment/review-sentiment
```

#### 브랜치 작업 흐름

**1. 새 기능 시작**
```bash
# develop 최신화
git checkout develop
git pull origin develop

# 기능 브랜치 생성
git checkout -b feature/product-crawling

# 작업 진행 및 커밋
git add .
git commit -m "feat(server): 쿠팡 상품 크롤러 구현"

# 원격 저장소에 푸시
git push -u origin feature/product-crawling
```

**2. 중간 동기화** (작업이 오래 걸리는 경우)
```bash
# develop의 최신 변경사항 가져오기
git checkout develop
git pull origin develop
git checkout feature/product-crawling
git merge develop

# 충돌 해결 후
git push origin feature/product-crawling
```

**3. PR 생성 및 머지**
- GitHub에서 PR 생성
- PR 템플릿에 따라 내용 작성
- CI/CD 테스트 통과 확인
- 코드 리뷰 요청 및 피드백 반영
- Approve 후 `develop`에 Squash Merge
- 브랜치 삭제

**4. 릴리스** (main에 배포)
```bash
# develop에서 release 브랜치 생성
git checkout develop
git checkout -b release/v1.0.0

# 버전 업데이트 및 최종 테스트
# package.json 버전 수정 등

# main에 머지
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# develop에도 머지
git checkout develop
git merge release/v1.0.0
git branch -d release/v1.0.0
```

**5. 핫픽스** (긴급 버그 수정)
```bash
# main에서 hotfix 브랜치 생성
git checkout main
git checkout -b hotfix/critical-security-fix

# 버그 수정 및 커밋
git commit -m "fix(security): XSS 취약점 수정"

# main과 develop 모두에 머지
git checkout main
git merge hotfix/critical-security-fix
git tag -a v1.0.1 -m "Hotfix v1.0.1"

git checkout develop
git merge hotfix/critical-security-fix

git branch -d hotfix/critical-security-fix
```

### Pull Request 가이드

#### PR 생성 전 체크리스트
```bash
# 1. 로컬 테스트 실행
yarn lint
yarn test
yarn build

# 2. 타입 체크
yarn workspace @shopping-fraud-detector/client tsc --noEmit
yarn workspace @shopping-fraud-detector/server tsc --noEmit

# 3. 변경 사항 확인
git status
git diff develop
```

#### PR 작성 가이드

1. **PR 생성** (GitHub에서)
   - Base: `develop` (또는 `main` for hotfix)
   - Compare: `feature/your-feature`
   - PR 템플릿 자동 로드

2. **제목 작성**
   ```
   [FEAT] 상품 크롤링 기능 구현
   [FIX] 로그인 에러 수정
   [REFACTOR] API 구조 개선
   [DOCS] 배포 가이드 추가
   ```

3. **본문 작성** (템플릿 참조)
   - 작업 내용 상세 설명
   - 스크린샷/로그 첨부 (필요시)
   - 테스트 방법 명시
   - 체크리스트 완료

4. **리뷰어 지정**
   - 최소 1명 이상의 리뷰어 지정
   - AI 코드 리뷰 자동 실행 확인

5. **CI/CD 확인**
   - GitHub Actions 워크플로우 통과
   - 빌드 성공 확인
   - 테스트 통과 확인

6. **피드백 반영**
   - 리뷰 코멘트 확인 및 수정
   - 수정 후 재요청

7. **머지**
   - Approve 후 Squash and Merge
   - 브랜치 자동 삭제 설정 확인

#### PR 리뷰 가이드

**리뷰어로서**:
- 코드 변경 사항을 꼼꼼히 확인
- 프로젝트 코딩 가이드라인 준수 확인
- 보안 취약점 확인
- 테스트 코드 포함 여부 확인
- 건설적인 피드백 제공
- Approve 또는 Request Changes

**리뷰 우선순위**:
1. 🚨 보안: API 키 노출, 인젝션 취약점
2. 🐛 버그: 논리 오류, 타입 에러
3. 🎯 기능: 요구사항 충족 여부
4. 🏗️ 구조: 아키텍처, 패턴 준수
5. 📝 코드 품질: 가독성, 유지보수성
6. 💅 스타일: 포맷팅, 네이밍

### 커밋 규칙

#### 커밋 메시지 주의사항
- 한 커밋에 한 가지 변경사항만 포함
- 50자 이내의 간결한 제목
- 필요시 본문에 상세 설명 추가
- 이슈 번호 참조 (예: `Closes #123`)

#### 나쁜 커밋 예시
```bash
❌ git commit -m "수정"
❌ git commit -m "update"
❌ git commit -m "여러 기능 추가 및 버그 수정"
```

#### 좋은 커밋 예시
```bash
✅ git commit -m "feat(server): 쿠팡 상품 크롤러 구현"
✅ git commit -m "fix(client): 무한 로딩 상태 수정"
✅ git commit -m "refactor(shared): 타입 정의 통합"
✅ git commit -m "docs: API 엔드포인트 문서화"
```

## 연락처

프로젝트 관련 문의는 GitHub Issues를 통해 등록해주세요.

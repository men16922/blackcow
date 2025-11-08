# 프론트엔드 개발자 Agent

## 역할

당신은 "쇼핑 흑우 감별사" 프로젝트의 전문 프론트엔드 개발자입니다.

## 기술 스택

- **프레임워크**: React 18
- **언어**: TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios
- **라우팅**: React Router
- **차트**: Chart.js (Phase 2)
- **상태 관리**: React Context API 또는 Zustand (필요시)
- **모노레포**: Turborepo + Yarn Workspaces

## 프로젝트 구조

```
apps/client/
├── src/
│   ├── components/
│   │   ├── common/          # 재사용 가능한 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── analysis/        # 분석 관련 컴포넌트
│   │   │   ├── AnalysisForm.tsx
│   │   │   ├── AnalysisResult.tsx
│   │   │   ├── BRSScore.tsx
│   │   │   ├── PriceAnalysisCard.tsx
│   │   │   ├── SellerAnalysisCard.tsx
│   │   │   ├── ReviewAnalysisCard.tsx
│   │   │   └── AlternativeProducts.tsx
│   │   └── layout/          # 레이아웃 컴포넌트
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── AnalysisPage.tsx
│   ├── services/
│   │   └── api.ts           # API 클라이언트
│   ├── hooks/
│   │   └── useAnalysis.ts   # 커스텀 훅
│   ├── utils/
│   │   └── formatters.ts    # 유틸리티 함수
│   ├── types/
│   │   └── index.ts         # 타입 정의
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 주요 책임

### 1. UI 컴포넌트 개발

- 반응형, 사용자 친화적 컴포넌트 구축
- React 모범 사례 및 Hooks 패턴 준수
- 적절한 컴포넌트 조합 구현
- 재사용 가능한 UI 컴포넌트 생성
- 모바일 반응형 디자인 보장

### 2. API 통합

- 백엔드 REST API 엔드포인트와 통합
- 로딩 상태 및 에러 우아하게 처리
- 적절한 에러 바운더리 구현
- 사용자 친화적 에러 메시지 표시
- API 호출 중 로딩 인디케이터 표시

### 3. 사용자 경험

- 직관적인 상품 분석 플로우 생성
- 명확한 시각적 인디케이터로 BRS 점수 표시
- 카드 기반 레이아웃으로 분석 결과 표시
- 적절한 폼 유효성 검사 구현
- 로딩 상태 및 스켈레톤 스크린 추가

### 4. 데이터 시각화

- 색상 코딩으로 위험 점수 표시 (초록/노랑/빨강)
- 분석 세부사항 표시 (가격, 판매자, 리뷰 점수)
- 이유 코드 명확히 시각화
- 대안 상품 추천 표시
- (Phase 2) 감정 분석 및 리스크 타임라인 차트 생성

## TypeScript 타입 정의

```typescript
// src/types/index.ts
export interface AnalysisRequest {
  url: string;
}

export interface AnalysisResult {
  brs: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasonCodes: string[];
  analyses: {
    price: PriceAnalysis;
    seller: SellerAnalysis;
    review: ReviewAnalysis;
  };
  recommendations: Product[];
  analyzedAt: string;
  processingTime: number;
}

export interface PriceAnalysis {
  currentPrice: number;
  medianPrice: number;
  isOutlier: boolean;
  score: number;
}

export interface SellerAnalysis {
  trustScore: number;
  accountAge: number;
  returnPolicy: string;
}

export interface ReviewAnalysis {
  totalReviews: number;
  averageRating: number;
  suspiciousPatterns: string[];
  score: number;
}

export interface Product {
  name: string;
  price: number;
  url: string;
  seller: string;
  rating: number;
}
```

## 컴포넌트 예제

### 1. 분석 폼 컴포넌트

```typescript
// src/components/analysis/AnalysisForm.tsx
import { useState, FormEvent } from 'react';
import { AnalysisResult } from '../../types';
import { analyzeProduct } from '../../services/api';

interface AnalysisFormProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export default function AnalysisForm({ onAnalysisComplete }: AnalysisFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await analyzeProduct(url);
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.response?.data?.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          상품 URL 입력
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.coupang.com/vp/products/..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? '분석 중...' : '분석 시작'}
      </button>
    </form>
  );
}
```

### 2. BRS 점수 표시 컴포넌트

```typescript
// src/components/analysis/BRSScore.tsx
interface BRSScoreProps {
  brs: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function BRSScore({ brs, riskLevel }: BRSScoreProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-100 border-green-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'HIGH': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW': return '낮음 (안전)';
      case 'MEDIUM': return '중간 (주의)';
      case 'HIGH': return '높음 (위험)';
      default: return '알 수 없음';
    }
  };

  const getScoreColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#16a34a';
      case 'MEDIUM': return '#ca8a04';
      case 'HIGH': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className="text-center p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">흑우 위험도 점수 (BRS)</h2>

      <div
        className="text-6xl font-bold mb-4"
        style={{ color: getScoreColor(riskLevel) }}
      >
        {brs}
      </div>

      <div className={`inline-block px-4 py-2 rounded-full font-semibold border ${getRiskColor(riskLevel)}`}>
        {getRiskLabel(riskLevel)}
      </div>

      <p className="mt-4 text-sm text-gray-600">
        0-30: 낮음 | 31-60: 중간 | 61-100: 높음
      </p>
    </div>
  );
}
```

### 3. 분석 결과 컴포넌트

```typescript
// src/components/analysis/AnalysisResult.tsx
import { AnalysisResult as AnalysisResultType } from '../../types';
import BRSScore from './BRSScore';
import PriceAnalysisCard from './PriceAnalysisCard';
import SellerAnalysisCard from './SellerAnalysisCard';
import ReviewAnalysisCard from './ReviewAnalysisCard';
import AlternativeProducts from './AlternativeProducts';

interface AnalysisResultProps {
  data: AnalysisResultType;
}

export default function AnalysisResult({ data }: AnalysisResultProps) {
  const { brs, riskLevel, reasonCodes, analyses, recommendations } = data;

  const formatReasonCode = (code: string): string => {
    const labels: Record<string, string> = {
      'PRICE_OUTLIER': '가격 이상',
      'REVIEW_ABUSING': '리뷰 조작 의심',
      'SELLER_UNTRUSTED': '판매자 신뢰도 낮음',
      'REVIEW_SURGE': '리뷰 폭증',
      'KEYWORD_ABUSING': '사기성 키워드 다수'
    };
    return labels[code] || code;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* BRS 점수 */}
      <BRSScore brs={brs} riskLevel={riskLevel} />

      {/* 위험 요소 */}
      {reasonCodes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">위험 요소</h3>
          <div className="flex flex-wrap gap-2">
            {reasonCodes.map((code, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {formatReasonCode(code)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 분석 세부사항 */}
      <div className="grid md:grid-cols-3 gap-6">
        <PriceAnalysisCard data={analyses.price} />
        <SellerAnalysisCard data={analyses.seller} />
        <ReviewAnalysisCard data={analyses.review} />
      </div>

      {/* 대안 상품 */}
      {recommendations.length > 0 && (
        <AlternativeProducts products={recommendations} />
      )}
    </div>
  );
}
```

### 4. 커스텀 훅

```typescript
// src/hooks/useAnalysis.ts
import { useState, useCallback } from 'react';
import { AnalysisResult } from '../types';
import { analyzeProduct } from '../services/api';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeProduct(url);
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '분석 중 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { analyze, loading, error, result, reset };
}
```

## API 클라이언트

```typescript
// src/services/api.ts
import axios from 'axios';
import { AnalysisResult, Product } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 (분석 시간 고려)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  config => {
    // 인증 토큰이 있으면 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  response => response,
  error => {
    // 공통 에러 처리
    if (error.response?.status === 429) {
      alert('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }
    return Promise.reject(error);
  }
);

// API 함수
export const analyzeProduct = async (url: string): Promise<AnalysisResult> => {
  const response = await apiClient.post<AnalysisResult>('/api/analyze', { url });
  return response.data;
};

export const getAlternatives = async (productName: string): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/api/alternatives', {
    params: { productName },
  });
  return response.data;
};

export default apiClient;
```

## 스타일 가이드라인 (Tailwind CSS)

### 색상 체계

```typescript
// 위험 수준 색상
const riskColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300',
};

// 주요 색상
const colors = {
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-gray-600 hover:bg-gray-700',
  success: 'bg-green-600 hover:bg-green-700',
  danger: 'bg-red-600 hover:bg-red-700',
};
```

### 반응형 디자인

- 모바일 우선 접근법
- Tailwind 반응형 프리픽스 사용: `sm:`, `md:`, `lg:`, `xl:`
- 모바일(320px), 태블릿(768px), 데스크톱(1024px+)에서 테스트
- 모바일에서 터치 친화적 버튼 크기 보장 (최소 44x44px)

## 테스트 요구사항

- React Testing Library로 컴포넌트 단위 테스트
- 사용자 플로우 통합 테스트
- 에러 상태 및 엣지 케이스 테스트
- 반응형 레이아웃 테스트
- 접근성 테스트 (a11y)

## 접근성 체크리스트

- [ ] 시맨틱 HTML 요소 사용
- [ ] 적절한 ARIA 레이블 추가
- [ ] 키보드 내비게이션 동작 확인
- [ ] 충분한 색상 대비 유지 (WCAG AA)
- [ ] 이미지에 alt 텍스트 추가
- [ ] 포커스 인디케이터 사용
- [ ] 스크린 리더로 테스트

## 성능 최적화

- 비용이 큰 컴포넌트에 React.memo 사용
- lazy loading으로 코드 스플리팅 구현
- 이미지 최적화 (WebP 형식, lazy loading)
- 번들 크기 최소화
- 배포용 프로덕션 빌드 사용
- 긴 목록에 가상 스크롤링 구현

## Turborepo 명령어

```bash
# 클라이언트만 개발 모드로 실행
yarn workspace @shopping-fraud-detector/client dev

# 클라이언트 빌드
yarn workspace @shopping-fraud-detector/client build

# 클라이언트 테스트
yarn workspace @shopping-fraud-detector/client test

# 모든 워크스페이스 빌드
yarn build

# 클라이언트 필터링
turbo run dev --filter=@shopping-fraud-detector/client
```

## 협업 참고사항

- 백엔드 팀과 API 계약 조율
- TypeScript 타입 안정성 활용
- Conventional Commits 사용: `feat:`, `fix:`, `style:`
- 기능 브랜치 생성: `feature/frontend/기능명`
- 백엔드와 API 통합 테스트 후 머지
- Storybook 사용 시 컴포넌트 props 및 사용법 문서화
- `packages/shared`의 공통 타입 활용

## UI/UX 모범 사례

- 모든 비동기 작업에 로딩 상태 표시
- 복구 옵션이 있는 명확한 에러 메시지 표시
- 로딩 중 스켈레톤 스크린 사용
- 도움이 되는 메시지와 함께 적절한 폼 유효성 검사 구현
- 파괴적 작업에 확인 대화상자 추가
- 복잡한 기능에 툴팁 사용
- 일관된 간격 및 타이포그래피 보장
- 기존 디자인 시스템 준수

## 작업 시 주의사항

1. 항상 기존 코드 구조를 먼저 확인
2. 새 컴포넌트 생성 전 기존 컴포넌트 재사용
3. 페이지 간 일관된 스타일 유지
4. 여러 기기에서 반응형 테스트
5. 로딩 및 에러 상태 처리
6. TypeScript 타입 정의 추가
7. 의미 있는 컴포넌트 및 변수 이름 작성
8. 컴포넌트를 작고 집중적으로 유지
9. `packages/shared`의 공통 타입 활용
10. Turborepo 워크스페이스 구조 준수

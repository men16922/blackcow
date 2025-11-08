---
name: add-shared-type
description: packages/shared에 공통 타입을 추가합니다
---

모노레포 공통 타입을 `packages/shared`에 추가합니다.

## 생성 위치
- `packages/shared/src/types/`

## 타입 파일 구조

```typescript
// packages/shared/src/types/analysis.ts

export interface Product {
  id: string;
  url: string;
  name: string;
  price: number;
  seller: SellerInfo;
  analyzedAt: number;
}

export interface SellerInfo {
  name: string;
  accountAge?: number;
  trustScore: number;
}

export interface AnalysisResult {
  brs: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasonCodes: string[];
  analyses: {
    price: PriceAnalysis;
    seller: SellerAnalysis;
    review: ReviewAnalysis;
  };
  recommendations: Product[];
}

// ... 추가 타입 정의
```

## Export 설정

`packages/shared/src/index.ts`에 추가:
```typescript
export * from './types/analysis';
export * from './types/crawler';
// ... 기타 타입
```

## 사용 방법

### Client (React)
```typescript
import type { Product, AnalysisResult } from '@shopping-fraud-detector/shared';

const [result, setResult] = useState<AnalysisResult | null>(null);
```

### Server (Express)
```typescript
import type { Product, AnalysisResult } from '@shopping-fraud-detector/shared';

const analyzeProduct = async (url: string): Promise<AnalysisResult> => {
  // ...
};
```

## 빌드
```bash
yarn workspace @shopping-fraud-detector/shared build
```

## 체크리스트
- [ ] 타입 파일 생성
- [ ] `src/index.ts`에 export 추가
- [ ] 빌드 성공 확인
- [ ] client/server에서 import 테스트
- [ ] JSDoc 주석 추가 (선택)

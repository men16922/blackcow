# Contributing to Shopping Fraud Detector (쇼핑 흑우 감별사)

쇼핑 흑우 감별사 프로젝트에 기여해주셔서 감사합니다! 🎉

## 📋 목차

- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 워크플로우](#개발-워크플로우)
- [코딩 가이드라인](#코딩-가이드라인)
- [커밋 규칙](#커밋-규칙)
- [Pull Request 프로세스](#pull-request-프로세스)
- [이슈 리포팅](#이슈-리포팅)

## 행동 강령

이 프로젝트는 모든 참여자가 존중받는 환경을 만들기 위해 노력합니다. 기여하기 전에 다음 원칙을 지켜주세요:

- 다른 사람을 존중하고 건설적인 피드백을 제공하세요
- 차별적이거나 공격적인 언어를 사용하지 마세요
- 다른 의견을 존중하고 합리적으로 토론하세요

## 시작하기

### 사전 요구사항

- Node.js 20+
- Yarn 1.22+
- Git
- Docker & Docker Compose (로컬 개발 시)
- Claude API Key ([발급 방법](https://console.anthropic.com))

### 초기 설정

```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/YOUR_USERNAME/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. upstream 원격 저장소 추가
git remote add upstream https://github.com/ORIGINAL_OWNER/shopping-fraud-detector.git

# 3. 의존성 설치
yarn install

# 4. Husky 설정 (Git hooks)
yarn husky install

# 5. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 Claude API Key 등을 설정

# 6. Docker 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 7. 개발 서버 실행
yarn dev
```

### 프로젝트 구조 이해

```
shopping-fraud-detector/
├── apps/
│   ├── client/      # React 프론트엔드
│   └── server/      # Express 백엔드
├── packages/
│   ├── shared/      # 공통 타입 및 유틸리티
│   ├── typescript-config/  # 공유 TS 설정
│   └── eslint-config/      # 공유 ESLint 설정
├── scripts/         # 유틸리티 스크립트
├── infra/          # 인프라 코드 (Docker, Terraform)
└── docs/           # 문서
```

자세한 내용은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 개발 워크플로우

### 1. 브랜치 생성

```bash
# develop 브랜치에서 최신 코드 가져오기
git checkout develop
git pull upstream develop

# 기능 브랜치 생성
git checkout -b feature/your-feature-name

# 또는 버그 수정
git checkout -b fix/bug-description
```

### 2. 개발

```bash
# 개발 서버 실행
yarn dev

# 특정 앱만 실행
yarn workspace @shopping-fraud-detector/client dev
yarn workspace @shopping-fraud-detector/server dev

# 타입 체크
yarn type-check

# 린트 검사
yarn lint

# 포맷팅
yarn format
```

### 3. 테스트

```bash
# 모든 테스트 실행
yarn test

# 특정 패키지 테스트
yarn workspace @shopping-fraud-detector/server test

# 커버리지 확인
yarn test:coverage
```

### 4. 커밋

```bash
# 변경 사항 추가
git add .

# 커밋 (Conventional Commits 형식)
git commit -m "feat(client): add product search feature"

# Pre-commit hook이 자동으로 실행됩니다:
# - ESLint 검사
# - Prettier 포맷팅
# - 커밋 메시지 형식 검증
```

### 5. 푸시 및 PR

```bash
# 브랜치 푸시
git push origin feature/your-feature-name

# GitHub에서 Pull Request 생성
```

## 코딩 가이드라인

### TypeScript

- **모든 코드는 TypeScript로 작성**
- `any` 타입 사용 지양 (`unknown` 사용 권장)
- 공통 타입은 `packages/shared/src/types`에 정의
- 엄격 모드 준수 (`strict: true`)

```typescript
// ✅ 좋은 예시
interface Product {
  id: string;
  name: string;
  price: number;
}

// ❌ 나쁜 예시
interface Product {
  id: any;
  data: object;
}
```

### 네이밍 컨벤션

| 대상            | 규칙                 | 예시                    |
| --------------- | -------------------- | ----------------------- |
| 파일 (컴포넌트) | PascalCase           | `ProductCard.tsx`       |
| 파일 (유틸리티) | kebab-case           | `api-client.ts`         |
| 변수/함수       | camelCase            | `analyzeProduct`        |
| 상수            | UPPER_SNAKE_CASE     | `API_BASE_URL`          |
| 타입/인터페이스 | PascalCase           | `AnalysisResult`        |
| Boolean         | is/has/should 접두사 | `isLoading`, `hasError` |

### React 컴포넌트

```tsx
// ✅ 좋은 예시
import React, { useState, useCallback } from 'react';
import type { Product } from '@shopping-fraud-detector/shared';

interface ProductCardProps {
  product: Product;
  onSelect?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onSelect?.(product.id);
  }, [onSelect, product.id]);

  return <div onClick={handleClick}>{/* ... */}</div>;
};
```

### Express API

```typescript
// ✅ 좋은 예시
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  url: z.string().url(),
});

export const analyzeProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = analyzeRequestSchema.parse(req.body);
    const result = await productAnalysisService.analyze(url);

    logger.info('Product analyzed', { url, brs: result.brs });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

### 에러 처리

- 모든 async 함수는 try-catch로 감싸기
- 의미 있는 에러 메시지 제공
- 프론트엔드에서는 사용자 친화적인 메시지 표시

```typescript
// ✅ 좋은 예시
try {
  const result = await analyzeProduct(url);
  setAnalysisResult(result);
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message);
  } else {
    setError('예상치 못한 오류가 발생했습니다.');
    console.error('Unexpected error:', error);
  }
} finally {
  setLoading(false);
}
```

## 커밋 규칙

### Conventional Commits 형식

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 커밋 타입

| 타입       | 설명                 | 예시                                       |
| ---------- | -------------------- | ------------------------------------------ |
| `feat`     | 새로운 기능          | `feat(client): add product search`         |
| `fix`      | 버그 수정            | `fix(server): resolve DB connection issue` |
| `docs`     | 문서 변경            | `docs: update README`                      |
| `style`    | 코드 스타일 (포맷팅) | `style: apply prettier`                    |
| `refactor` | 리팩토링             | `refactor(api): simplify error handling`   |
| `test`     | 테스트 추가/수정     | `test(server): add unit tests`             |
| `chore`    | 빌드/도구 변경       | `chore: update dependencies`               |
| `perf`     | 성능 개선            | `perf(client): optimize rendering`         |

### Scope 예시

- `client`: 프론트엔드 (React)
- `server`: 백엔드 (Express)
- `shared`: 공통 패키지
- `infra`: 인프라 설정
- `scripts`: 유틸리티 스크립트
- `docs`: 문서

### 커밋 메시지 예시

```bash
# ✅ 좋은 예시
git commit -m "feat(client): add BRS score display component"
git commit -m "fix(server): handle Claude API timeout"
git commit -m "docs: add contributing guide"

# ❌ 나쁜 예시
git commit -m "수정"
git commit -m "update"
git commit -m "fix bug and add feature"  # 한 커밋에 여러 변경사항
```

## Pull Request 프로세스

### PR 생성 전 체크리스트

```bash
# 1. 최신 코드 동기화
git checkout develop
git pull upstream develop
git checkout your-feature-branch
git rebase develop

# 2. 로컬 테스트
yarn lint
yarn type-check
yarn test
yarn build

# 3. 변경 사항 확인
git status
git diff develop
```

### PR 템플릿

PR을 생성하면 자동으로 템플릿이 로드됩니다. 다음 항목을 작성해주세요:

- **개요**: 변경 사항 요약
- **작업 유형**: feat, fix, docs 등
- **관련 이슈**: Closes #123
- **작업 내용**: 프론트엔드, 백엔드, AI 레이어별 변경사항
- **테스트 방법**: 검증 방법
- **체크리스트**: 모든 항목 확인

### PR 리뷰 기준

리뷰어는 다음을 확인합니다:

1. **보안**: API 키 노출, 인젝션 취약점
2. **코드 품질**: 타입 안정성, 에러 처리, 가독성
3. **성능**: 불필요한 리렌더링, API 호출 최적화
4. **테스트**: 테스트 코드 포함 여부
5. **문서**: 필요한 경우 문서 업데이트

### 머지 정책

- **최소 1명의 Approve** 필요
- **CI/CD 테스트** 통과 필수
- **컨플릭트 해결** 후 머지
- **Squash and Merge** 사용 (커밋 히스토리 정리)

## 이슈 리포팅

### 버그 리포트

버그를 발견하셨나요? [Issue 생성](../../issues/new?template=bug_report.md)

**포함할 내용:**

- 버그 설명
- 재현 방법
- 예상 동작 vs 실제 동작
- 스크린샷/로그
- 환경 정보 (브라우저, OS 등)

### 기능 제안

새로운 기능을 제안하고 싶으신가요? [Issue 생성](../../issues/new?template=feature_request.md)

**포함할 내용:**

- 기능 설명
- 해결하려는 문제
- 제안하는 해결 방법
- 우선순위

## 도움이 필요하신가요?

- 📖 [CLAUDE.md](./CLAUDE.md): 프로젝트 가이드
- 📖 [README.md](./README.md): 프로젝트 개요
- 💬 [GitHub Discussions](../../discussions): 질문 및 토론
- 🐛 [GitHub Issues](../../issues): 버그 및 기능 요청

## 감사합니다!

여러분의 기여가 이 프로젝트를 더 나은 방향으로 만들어갑니다. 🎉

모든 기여자는 [Contributors](../../graphs/contributors) 페이지에 기록됩니다.

---
name: create-api-route
description: Express API 라우트를 생성합니다 (TypeScript + Zod 검증)
---

새로운 Express API 엔드포인트를 생성합니다.

## 생성 위치

- `apps/server/src/routes/` 디렉토리

## 템플릿 구조

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const router = Router();

// Request 스키마 정의
const requestSchema = z.object({
  // 필드 정의
});

// GET /api/[resource]
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 로직 구현
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

// POST /api/[resource]
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = requestSchema.parse(req.body);
    // 로직 구현
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

export default router;
```

## 체크리스트

- [ ] Zod 스키마로 입력 검증
- [ ] try-catch 에러 처리
- [ ] Winston 로거 사용
- [ ] TypeScript 타입 안정성
- [ ] `apps/server/src/index.ts`에 라우트 등록

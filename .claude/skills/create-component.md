---
name: create-component
description: React 컴포넌트를 생성합니다 (TypeScript + Tailwind CSS)
---

새로운 React 컴포넌트를 생성합니다.

## 생성 위치

- `apps/client/src/components/` 디렉토리

## 템플릿 구조

```tsx
import React from 'react';

interface [ComponentName]Props {
  // Props 정의
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({}) => {
  return (
    <div className="">
      {/* 컴포넌트 내용 */}
    </div>
  );
};
```

## 체크리스트

- [ ] TypeScript 타입 정의
- [ ] Props interface 작성
- [ ] Tailwind CSS 클래스 사용
- [ ] 파일명은 PascalCase (예: `ProductCard.tsx`)
- [ ] Export 확인

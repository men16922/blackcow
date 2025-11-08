---
name: debug-crawler
description: 쇼핑몰 크롤러 디버깅을 도와줍니다
---

상품 크롤링 문제를 디버깅합니다.

## 디버깅 단계

### 1. HTML 구조 확인

```bash
# Playwright로 페이지 로드 테스트
curl -s [URL] | grep -i "price\|product\|seller"
```

### 2. Selector 검증

- 가격: `.price`, `[data-price]`, `.sale-price`
- 상품명: `h1`, `.product-title`, `[data-product-name]`
- 판매자: `.seller-name`, `[data-seller]`

### 3. 동적 콘텐츠 확인

- JavaScript 렌더링 필요 여부
- API 호출 여부 (Network 탭 확인)
- 지연 로딩 여부

### 4. Rate Limiting 확인

- 429 에러: 요청 속도 제한
- 403 에러: User-Agent 또는 헤더 문제
- 해결: `setTimeout()` 추가, User-Agent 설정

## 프로젝트 크롤러 위치

- `apps/server/src/services/crawler/`

## 지원 쇼핑몰

- 쿠팡 (Coupang)
- 네이버쇼핑
- 11번가

## 체크리스트

- [ ] HTML selector 정확성
- [ ] 동적 콘텐츠 로딩 대기
- [ ] Rate limiting 고려
- [ ] 에러 처리 추가

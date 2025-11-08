---
name: test-api
description: API 엔드포인트를 테스트합니다 (curl 예시 제공)
---

Express API 엔드포인트를 테스트합니다.

## 서버 정보
- 로컬: `http://localhost:3000`
- API 기본 경로: `/api`

## 주요 엔드포인트 테스트

### 1. 상품 분석 (POST /api/analyze)
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.coupang.com/vp/products/123456"
  }'
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "brs": 65,
    "riskLevel": "HIGH",
    "analyses": { ... }
  }
}
```

### 2. 대안 상품 조회 (GET /api/alternatives)
```bash
curl "http://localhost:3000/api/alternatives?productName=아이폰%2015"
```

### 3. 헬스체크 (GET /health)
```bash
curl http://localhost:3000/health
```

**예상 응답**:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## 에러 응답 처리

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 디버깅 팁
- 개발 서버 로그 확인: `yarn workspace @shopping-fraud-detector/server dev`
- Winston 로그 위치: `apps/server/logs/`
- DynamoDB 로컬 확인: `http://localhost:8000`

## 체크리스트
- [ ] 서버 실행 중인지 확인
- [ ] DynamoDB 컨테이너 실행 중
- [ ] 환경 변수 설정 (.env.local)
- [ ] 요청 헤더 정확성
- [ ] 응답 상태 코드 확인

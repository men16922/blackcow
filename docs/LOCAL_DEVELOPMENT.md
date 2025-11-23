# 로컬 개발 환경 설정 가이드

이 문서는 **쇼핑 흑우 감별사** 프로젝트를 로컬에서 실행하고 테스트하기 위한 최소 가이드입니다.

## 사전 요구사항

다음 도구들이 설치되어 있어야 합니다:

- **Node.js**: 20.18.1 이상 (`node --version`)
- **Yarn**: 1.22.0 이상 (`yarn --version`)

## 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 의존성 설치
yarn install

# 3. 환경 변수 설정
cp .env.example .env.local

# 4. .env.local 편집 (PERPLEXITY_API_KEY 필수)
# vim .env.local

# 5. 도커로 dynamodb 실행
docker compose up -d

# 6. 개발 서버 실행
yarn dev
```

접속 주소:

- **Client**: http://localhost:3001
- **Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **DynamoDB WEB Admin**: http://localhost:8001

## 환경 변수 설정

`.env.local` 파일에서 최소한 다음 항목을 설정해야 합니다:

```bash
# Perplexity API (필수!)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxx

# 포트 설정 (선택, 충돌 시 변경)
PORT=3000
CLIENT_PORT=3001

# DynamoDB
# .env.local에 추가
DYNAMODB_ENDPOINT=http://localhost:8000
```

### Perplexity API 키 발급

1. [Perplexity AI](https://www.perplexity.ai/) 계정 생성
2. [API 설정 페이지](https://docs.perplexity.ai/)에서 키 발급
3. `.env.local`의 `PERPLEXITY_API_KEY`에 입력

## 서버 실행 테스트

### 1. 서버 상태 확인

```bash
# Health check
curl http://localhost:3000/health
```

예상 응답:

```json
{
  "status": "ok",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "uptime": 123.456
}
```

### 2. API 테스트

```bash
# 제품 검색 테스트
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"productName": "아이폰17"}'
```

### 3. Client 접속 확인

브라우저에서 http://localhost:3001 접속하여 UI 확인

## 주요 명령어

```bash
# 개발 서버 실행
yarn dev

# 빌드
yarn build

# 테스트
yarn test

# 코드 검사
yarn lint
yarn type-check
yarn format:check
```

## DB

### DynamoDB 로컬 설정

프로젝트는 DynamoDB를 데이터베이스로 사용합니다. 로컬 개발을 위해 Docker Compose로 DynamoDB Local을 실행합니다.

**1. DynamoDB 실행**

```bash
# Docker Compose로 DynamoDB 및 관리자 UI 실행
docker compose up -d

# 실행 확인
docker ps | grep dynamodb
```

**2. 테이블 생성**

```bash
# DynamoDB 테이블 자동 생성
yarn setup:dynamodb
```

생성되는 테이블:
- **BlackCow_SearchSessions**: 검색 세션 정보 저장
- **BlackCow_SearchHistory**: 검색 이력 저장
- **BlackCow_AnalysisCache**: 분석 결과 캐시

**3. DynamoDB Admin UI**

브라우저에서 http://localhost:8001 접속하여 테이블 관리 및 데이터 확인

**DynamoDB 중지**

```bash
docker compose down
```

## 트러블슈팅

### Yarn 설치 오류

**증상**: `yarn install` 실패

**해결**:

```bash
rm -rf node_modules yarn.lock
yarn cache clean
yarn install
```

### TypeScript 타입 에러

**증상**: Shared 패키지 타입 인식 실패

**해결**:

```bash
yarn workspace @shopping-fraud-detector/shared build
rm -rf apps/*/tsconfig.tsbuildinfo
```

### Perplexity API 에러

**증상**: `401 Unauthorized`

**해결**:

1. `.env.local`에서 API 키 확인 (앞뒤 공백 제거)
2. [Perplexity Dashboard](https://www.perplexity.ai/)에서 키 유효성 확인
3. 필요시 새 API 키 발급

## 추가 리소스

- [프로젝트 가이드](../CLAUDE.md)
- [Perplexity API 문서](https://docs.perplexity.ai/)
- [Yarn Workspaces 문서](https://classic.yarnpkg.com/en/docs/workspaces/)

# 기술 스택

## 백엔드

- **런타임**: Node.js 18+
- **프레임워크**: Express 4.x
- **데이터베이스**: AWS DynamoDB (NoSQL)
- **크롤러**: Cheerio, Axios
- **AI/ML**: AWS Bedrock Claude Sonnet 4.0 / Claude API / Ollama (로컬)
- **로깅**: Winston
- **검증**: Joi
- **보안**: Helmet, express-rate-limit
- **프로세스 관리자**: PM2

## 프론트엔드

- **프레임워크**: React 18
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios
- **차트**: Chart.js (Phase 2)
- **PDF**: jsPDF (Phase 3)

## DevOps & 인프라

- **배포**: AWS Lightsail (월 $5 단일 서버)
- **리버스 프록시**: Nginx
- **컨테이너**: Docker (로컬 개발 전용)
- **테스팅**: Jest, Supertest
- **린팅**: ESLint

## AI 프로바이더 옵션

프로젝트는 유연성을 위해 여러 AI 프로바이더를 지원합니다:

1. **AWS Bedrock** (프로덕션) - Claude Sonnet 4.0, AWS 계정 필요
2. **Claude API** (로컬 개발) - API 키 기반, AWS 계정 불필요
3. **Ollama** (로컬 개발) - 무료, 오프라인, Qwen 2.5 또는 GPT-OSS 모델 사용

`AI_PROVIDER` 환경 변수로 설정: `bedrock`, `claude`, 또는 `local`

## 주요 명령어

### 초기 설정

```bash
# 의존성 설치
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# 환경 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 설정값 입력

# Docker 서비스 시작 (DynamoDB + Ollama)
docker-compose -f docker-compose.local.yml up -d

# 로컬 환경 설정 (테이블 생성 + 모델 다운로드)
npm run setup:local
```

### 개발

```bash
# 백엔드 시작 (server/ 디렉토리에서)
npm run dev

# 프론트엔드 시작 (client/ 디렉토리에서)
npm start

# 테스트 실행
npm test

# 린팅 실행
npm run lint
```

### 데이터베이스 관리

```bash
# DynamoDB 테이블 생성
npm run setup:dynamodb

# Ollama 모델 설정
npm run setup:ollama

# DynamoDB 테이블 목록 조회 (로컬)
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### Docker 관리

```bash
# 모든 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 모든 서비스 중지
docker-compose -f docker-compose.local.yml down

# 로그 확인
docker-compose -f docker-compose.local.yml logs -f

# 특정 서비스 재시작
docker-compose -f docker-compose.local.yml restart ollama
```

### 프로덕션 배포

```bash
# 프론트엔드 빌드
cd client && npm run build

# PM2로 시작
pm2 start ecosystem.config.js

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs shopping-fraud-api
```

## 환경 변수

주요 환경 변수 설정:

- `NODE_ENV`: development | production
- `PORT`: 백엔드 서버 포트 (기본값: 3000)
- `CLIENT_PORT`: 프론트엔드 개발 서버 포트 (기본값: 3001)
- `AI_PROVIDER`: bedrock | claude | local
- `DYNAMODB_ENDPOINT`: DynamoDB 엔드포인트 (로컬: http://localhost:8000)
- `OLLAMA_ENDPOINT`: Ollama 엔드포인트 (기본값: http://localhost:11434)
- `OLLAMA_MODEL`: 모델 이름 (qwen2.5:7b 또는 gpt-oss)

전체 목록은 `.env.example` 참조

## 성능 요구사항

- 분석 완료 시간: 10초 이내
- API 속도 제한: 사용자당 분당 10 요청
- DynamoDB 캐싱: 6시간 TTL
- 가격 이력 보관: 30일

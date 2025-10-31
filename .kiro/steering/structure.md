# 프로젝트 구조

## 디렉토리 구성

```
shopping-fraud-detector/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   └── App.jsx
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Data models
│   │   ├── db/                 # Database clients
│   │   ├── middleware/         # Express middleware
│   │   ├── utils/              # Utility functions
│   │   └── app.js              # Express app entry
│   └── package.json
│
├── docs/                        # Documentation
│   └── LOCAL_DEVELOPMENT.md
│
├── .kiro/                       # Kiro IDE configuration
│   ├── specs/                  # Design specifications
│   └── steering/               # AI assistant guidelines
│
├── idea/                        # Planning documents (Korean)
│   ├── SRS.md
│   └── 쇼핑흑우_Notion_기획서.md
│
├── generated-diagrams/          # Architecture diagrams
├── scripts/                     # Setup and utility scripts
├── docker-compose.local.yml     # Local development services
├── ecosystem.config.js          # PM2 configuration
├── nginx.conf                   # Nginx reverse proxy config
└── package.json                 # Root package.json
```

## 주요 디렉토리

### `/server/src/routes/`
API 엔드포인트 정의. 각 파일은 라우트 그룹에 해당:
- `analyze.js` - POST /api/analyze (메인 분석 엔드포인트)
- `alternatives.js` - GET /api/alternatives (상품 추천)
- `history.js` - GET /api/history/:productId (Phase 2)
- `compare.js` - POST /api/compare (Phase 3)
- `report.js` - POST /api/report (Phase 3)

### `/server/src/services/`
관심사별로 분리된 핵심 비즈니스 로직:
- `crawler.js` - 쿠팡, 네이버, 11번가 웹 스크래핑
- `priceAnalyzer.js` - Median + MAD 가격 이상치 탐지
- `sellerAnalyzer.js` - 판매자 신뢰도 점수 계산
- `reviewAnalyzer.js` - AI 기반 리뷰 감정 분석
- `riskEngine.js` - BRS 점수 계산
- `recommender.js` - 대안 상품 추천
- `bedrockService.js` - AWS Bedrock API 클라이언트
- `aiService.js` - 멀티 프로바이더 AI 추상화 레이어

### `/server/src/db/`
데이터베이스 레이어:
- `dynamodb.js` - DynamoDB 클라이언트 설정
- `cache.js` - 캐싱 레이어 (6시간 TTL)

### `/server/src/middleware/`
Express 미들웨어:
- `rateLimiter.js` - 속도 제한 (사용자당 분당 10 요청)
- `errorHandler.js` - 중앙 집중식 오류 처리
- `validator.js` - Joi를 사용한 요청 검증

### `/client/src/components/`
React 컴포넌트:
- `AnalysisCard.jsx` - 분석 결과 표시
- `RiskBadge.jsx` - 시각적 위험도 표시기
- `RecommendationList.jsx` - 대안 상품 목록
- Phase 2/3 고급 기능용 컴포넌트

## 파일 명명 규칙

- **JavaScript 파일**: camelCase (예: `priceAnalyzer.js`)
- **React 컴포넌트**: PascalCase (예: `AnalysisCard.jsx`)
- **설정 파일**: kebab-case (예: `docker-compose.local.yml`)
- **문서**: UPPERCASE 또는 설명적 (예: `README.md`, `LOCAL_DEVELOPMENT.md`)

## DynamoDB 테이블

- **Products** - 캐시된 상품 데이터 (6시간 TTL)
- **AnalysisResults** - 분석 이력 (만료 없음)
- **PriceHistory** - 가격 추적 (30일 TTL)
- **FraudReports** - 사용자 신고 (90일 TTL, Phase 3)

## 설정 파일

- `.env.example` - 환경 변수 템플릿
- `.env.local` - 개발자별 설정 (gitignore됨)
- `ecosystem.config.js` - PM2 프로세스 관리자 설정
- `nginx.conf` - Nginx 리버스 프록시 설정
- `docker-compose.local.yml` - 로컬 개발 서비스

## 중요 사항

- **포트 할당**: 충돌 방지를 위해 각 개발자는 고유한 포트 사용 (docs/LOCAL_DEVELOPMENT.md 참조)
- **데이터 격리**: Docker 볼륨은 사용자별로 분리 (`dynamodb-data-${USER}`, `ollama-data-${USER}`)
- **AI 프로바이더**: `AI_PROVIDER` 환경 변수로 설정 (bedrock/claude/local)
- **캐싱 전략**: 상품 데이터 6시간 TTL, 가격 이력 30일
- **언어**: 기획 문서와 일부 주석은 한글, 코드와 기술 문서는 영어

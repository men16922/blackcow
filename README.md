# 🛡️ 쇼핑 흑우 감별사

> AI 기반 온라인 쇼핑 사기 탐지 서비스

온라인 쇼핑몰 상품 링크를 분석하여 사기 위험도를 평가하고, 안전한 쇼핑을 돕는 웹 애플리케이션입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![AWS](https://img.shields.io/badge/AWS-Lightsail%20%7C%20DynamoDB%20%7C%20Bedrock-orange)](https://aws.amazon.com/)

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [아키텍처](#-아키텍처)
- [빠른 시작](#-빠른-시작)
- [로컬 개발](#-로컬-개발)
- [배포](#-배포)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [테스트](#-테스트)
- [개발 도구](#️-개발-도구)
- [AI 코드 리뷰](#-ai-코드-리뷰)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

## ✨ 주요 기능

### MVP (Phase 1)

- 🔍 **상품 크롤링**: 쿠팡, 네이버쇼핑, 11번가 지원
- 💰 **가격 분석**: Median + MAD 기반 이상치 탐지
- 👤 **판매자 신뢰도**: 계정 연령, 반품 정책, 배송지 평가
- 📝 **리뷰 분석**: AI 기반 감정 분석 및 어뷰징 탐지
- 📊 **BRS 점수**: 0-100점 사기 위험도 점수
- 🎯 **대안 추천**: 위험 상품 대체 옵션 제공

### Phase 2 (계획)

- 🤖 **AI 추천 코멘트**: 자연어 분석 결과 요약
- 📈 **리뷰 감정 지도**: 감정 분포 시각화
- 🚨 **위험 키워드 감지**: 사기성 키워드 하이라이트
- 📉 **리스크 타임라인**: 위험도 변화 추이

### Phase 3 (계획)

- ⚖️ **상품 비교**: 두 상품 동시 비교
- 📄 **PDF 리포트**: 분석 결과 다운로드
- 👥 **사용자 참여형 DB**: 커뮤니티 기반 사기 신고

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express 4.x
- **Database**: AWS DynamoDB
- **AI/ML**: AWS Bedrock Claude Sonnet 4.0 / Claude API
- **Crawler**: Cheerio, Axios
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Chart.js (Phase 2)

### DevOps & Infrastructure
- **Monorepo**: Yarn Workspaces
- **IaC**: Terraform
- **Container**: Docker, Docker Compose
- **Deployment**: AWS Lightsail (수동 배포)
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Monitoring**: CloudWatch (AWS)
- **Git Hooks**: Husky, lint-staged

## 🏗 아키텍처

![아키텍처 다이어그램](generated-diagrams/diagram_a88b46a7.png)

### 배포 구성

- **AWS Lightsail** ($5/월): 단일 서버 (Nginx + Node.js + Express)
- **AWS DynamoDB** (무료 티어): NoSQL 데이터베이스
- **AI 프로바이더** (선택 가능):
  - Claude API (개발 및 프로덕션 권장)
  - AWS Bedrock (프로덕션 대안)

### 비용

- **MVP**: $7-9/월
- **Phase 2**: $8-11/월
- **Phase 3**: $8-12/월

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose (로컬 개발 시)
- AWS 계정 (프로덕션 배포 시)
- Claude API Key (권장)

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 의존성 설치
yarn install

# 3. Git Hooks 설정 (Husky)
yarn prepare

# 4. 환경 변수 설정
cp .env.example .env.local
nano .env.local

# 5. Docker 서비스 시작 (DynamoDB)
docker-compose -f docker-compose.local.yml up -d

# 6. 로컬 환경 설정 (DynamoDB 테이블 생성)
yarn setup:dynamodb

# 7. 개발 서버 시작
yarn dev
```

### 환경 변수 설정

```bash
# .env.local
NODE_ENV=development
PORT=3000
CLIENT_PORT=3001

# AI 프로바이더 선택
AI_PROVIDER=claude  # 'claude' 또는 'bedrock'

# Claude API (권장)
CLAUDE_API_KEY=sk-ant-api03-your-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# 또는 AWS Bedrock (프로덕션 대안)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
```

## 💻 로컬 개발

### AI 프로바이더 선택

#### Option 1: Claude API (권장) ⭐

```bash
# 1. API Key 발급: https://console.anthropic.com
# 2. .env.local 설정
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-xxx

# 3. 개발 서버 시작
npm run dev
```

**장점**: API Key만으로 즉시 사용, 높은 품질, 빠른 응답 속도
**비용**: 신규 가입 시 $5 무료 크레딧, 이후 $0.003/1K 토큰
**권장 용도**: 로컬 개발 및 프로덕션

#### Option 2: AWS Bedrock (대안)

```bash
# 1. AWS 자격 증명 설정
aws configure

# 2. .env.local 설정
AI_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# 3. 개발 서버 시작
npm run dev
```

**장점**: AWS 생태계 통합, 프로덕션 안정성
**요구사항**: AWS 계정, IAM 권한
**권장 용도**: AWS 인프라를 이미 사용 중인 경우

### 협업 개발

여러 개발자가 독립적으로 작업할 수 있도록 포트를 다르게 설정하세요:

```bash
# 개발자 1
PORT=3000
CLIENT_PORT=3001
DYNAMODB_PORT=8000

# 개발자 2
PORT=3010
CLIENT_PORT=3011
DYNAMODB_PORT=8010

# 개발자 3
PORT=3020
CLIENT_PORT=3021
DYNAMODB_PORT=8020
```

## 🚢 배포

프로젝트는 다양한 배포 방법을 지원합니다.

### Option 1: Docker (권장)

```bash
# 전체 스택 실행
cd infra/docker
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

### Option 2: Terraform (IaC)

```bash
cd infra/terraform

# 1. 변수 파일 설정
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 편집 (Claude API Key 등)

# 2. 초기화 및 배포
terraform init
terraform plan
terraform apply

# 3. 출력 확인
terraform output
```

상세 가이드: [infra/terraform/README.md](./infra/terraform/README.md)

### Option 3: AWS Lightsail (수동)

```bash
# 1. 인스턴스 생성 및 설정
./infra/lightsail/setup.sh

# 2. 애플리케이션 배포
./infra/lightsail/deploy-to-lightsail.sh
```

### GitHub Actions (CI)

Pull Request 생성 시 자동으로 코드 검증이 실행됩니다.

**검증 항목:**
- ESLint 린트 검사
- Prettier 포맷 체크
- TypeScript 타입 체크
- 테스트 실행
- 빌드 성공 여부

워크플로우 파일: [.github/workflows/ci.yml](.github/workflows/ci.yml)

**배포**: Terraform 스크립트 또는 수동 배포 스크립트 사용

## 📁 프로젝트 구조

```
shopping-fraud-detector/
├── .claude/                      # Claude Code 설정
│   ├── agents/                   # 특화 에이전트 프롬프트
│   │   ├── backend-developer.md
│   │   ├── frontend-developer.md
│   │   └── code-reviewer.md
│   ├── settings.local.json
│   └── settings.md               # 프로젝트 설정
│
├── .github/                      # GitHub 설정
│   ├── workflows/                # CI/CD 워크플로우
│   │   ├── code-review.yml       # AI 코드 리뷰
│   │   └── deploy.yml            # 자동 배포
│   ├── ISSUE_TEMPLATE/           # Issue 템플릿
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md  # PR 템플릿
│
├── .husky/                       # Git Hooks
│   ├── pre-commit                # 커밋 전 린트/포맷
│   ├── commit-msg                # 커밋 메시지 검증
│   └── README.md
│
├── apps/                         # 애플리케이션
│   ├── client/                   # React 프론트엔드
│   │   ├── src/
│   │   │   ├── components/       # UI 컴포넌트
│   │   │   ├── pages/            # 페이지
│   │   │   └── services/         # API 클라이언트
│   │   └── package.json
│   │
│   └── server/                   # Express 백엔드
│       ├── src/
│       │   ├── routes/           # API 라우트
│       │   ├── services/         # 비즈니스 로직
│       │   ├── models/           # 데이터 모델
│       │   ├── db/               # DynamoDB 클라이언트
│       │   └── middleware/       # 미들웨어
│       └── package.json
│
├── packages/                     # 공유 패키지
│   └── shared/                   # 공통 타입 및 유틸리티
│
├── scripts/                      # 유틸리티 스크립트
│   ├── deploy.sh                 # 배포 스크립트
│   ├── setup-db.sh               # DynamoDB 초기화
│   ├── health-check.sh           # 헬스체크
│   └── backup.sh                 # 백업
│
├── infra/                        # 인프라 코드 (IaC)
│   ├── docker/                   # Docker 설정
│   │   ├── Dockerfile.client
│   │   ├── Dockerfile.server
│   │   ├── nginx.conf
│   │   └── docker-compose.yml
│   ├── terraform/                # Terraform IaC
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── lightsail/                # AWS Lightsail 설정
│       ├── setup.sh
│       └── deploy-to-lightsail.sh
│
├── docs/                         # 문서
│   └── CODE_REVIEW_SETUP.md
│
├── .editorconfig                 # 에디터 설정
├── .eslintrc.js                  # ESLint 설정
├── .prettierrc                   # Prettier 설정
├── .lintstagedrc.json            # lint-staged 설정
├── tsconfig.json                 # TypeScript 설정
├── .gitignore
├── .dockerignore
│
├── CLAUDE.md                     # 프로젝트 가이드 (상세)
├── CONTRIBUTING.md               # 기여 가이드
├── README.md                     # 프로젝트 개요
├── package.json                  # 루트 패키지 설정 (Yarn Workspaces)
└── docker-compose.local.yml      # 로컬 개발 환경
```

자세한 내용은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 📚 API 문서

### POST /api/analyze

상품 URL을 분석하여 BRS 점수를 반환합니다.

**Request:**
```json
{
  "url": "https://www.coupang.com/vp/products/123456"
}
```

**Response:**
```json
{
  "brs": 65,
  "riskLevel": "HIGH",
  "reasonCodes": ["PRICE_OUTLIER", "REVIEW_ABUSING"],
  "analyses": {
    "price": {
      "score": 40,
      "median": 50000,
      "mad": 5000,
      "isOutlier": true
    },
    "seller": {
      "score": 15,
      "trustScore": 45
    },
    "review": {
      "score": 10,
      "patterns": {
        "hasReviewSurge": true,
        "hasRepetition": false,
        "lacksDiversity": true
      },
      "sentiment": {
        "positive": 27,
        "neutral": 2,
        "negative": 1
      },
      "abusingKeywords": ["정품", "최저가"]
    }
  },
  "recommendations": [
    {
      "url": "https://www.naver.com/...",
      "title": "대안 상품",
      "price": 45000,
      "brs": 25
    }
  ],
  "analyzedAt": "2025-11-01T12:00:00Z",
  "processingTime": 8500
}
```

### GET /api/alternatives

대안 상품을 검색합니다.

**Query Parameters:**
- `productName`: 상품명 (required)

**Response:**
```json
{
  "alternatives": [
    {
      "url": "string",
      "title": "string",
      "price": 45000,
      "platform": "naver",
      "brs": 25,
      "seller": {
        "name": "string",
        "trustScore": 85
      }
    }
  ],
  "sortedBy": "price_asc"
}
```

## 🧪 테스트

```bash
# 단위 테스트
yarn test

# 통합 테스트
yarn test:integration

# E2E 테스트
yarn test:e2e

# 커버리지
yarn test:coverage
```

## 🛠️ 개발 도구

### Git Hooks (Husky)

프로젝트는 Husky를 사용하여 Git Hooks를 관리합니다.

**Pre-commit Hook**
- ESLint로 코드 검사 및 자동 수정
- Prettier로 코드 포맷팅
- 변경된 파일만 검사 (lint-staged)

**Commit-msg Hook**
- Conventional Commits 형식 검증
- 올바른 형식: `<type>(<scope>): <description>`

```bash
# Hook 건너뛰기 (비상시만 사용)
git commit -m "message" --no-verify
```

### EditorConfig

모든 개발자가 동일한 에디터 설정을 사용하도록 `.editorconfig`를 제공합니다.

- 들여쓰기: 2칸 (space)
- 줄바꿈: LF
- 인코딩: UTF-8
- 파일 끝 빈 줄: 추가

VS Code 사용자는 **EditorConfig for VS Code** 확장을 설치하세요.

### 유용한 명령어

```bash
# 린트 검사
yarn lint

# 린트 자동 수정
yarn lint:fix

# 타입 체크
yarn type-check

# 코드 포맷팅
yarn format

# 포맷 검사
yarn format:check

# 전체 빌드
yarn build

# 캐시 정리
yarn clean
```

### 스크립트 실행

```bash
# 배포
./scripts/deploy.sh

# 헬스체크
./scripts/health-check.sh

# 백업
./scripts/backup.sh

# DynamoDB 초기화
./scripts/setup-db.sh
```

## 🤖 AI 코드 리뷰

이 프로젝트는 GitHub Actions를 통한 자동 AI 코드 리뷰를 지원합니다.

> 📖 **상세 가이드**: [docs/CODE_REVIEW_SETUP.md](docs/CODE_REVIEW_SETUP.md)에서 전체 설정 방법과 고급 기능을 확인하세요.

### 설정 방법

1. **GitHub Repository Settings > Secrets and variables > Actions로 이동**

2. **`ANTHROPIC_API_KEY` Secret 추가**
   - [Anthropic Console](https://console.anthropic.com)에서 API Key 발급
   - Repository Secret으로 추가: `ANTHROPIC_API_KEY=sk-ant-api03-xxx`

3. **Pull Request 생성 시 자동 실행**
   - PR을 생성하거나 업데이트하면 자동으로 AI 코드 리뷰가 실행됩니다
   - 코드 변경사항을 분석하여 리뷰 코멘트를 자동으로 달아줍니다

### 리뷰 항목

AI 코드 리뷰는 다음 항목들을 자동으로 검사합니다:

- 🐛 **버그 & 에러**: 로직 에러, 런타임 에러 가능성, 엣지 케이스
- 🔒 **보안**: SQL Injection, XSS, 인증 문제 등 보안 취약점
- 🎯 **베스트 프랙티스**: 코드 스타일, 네이밍 컨벤션, 디자인 패턴
- ⚡ **성능**: 비효율적인 코드, 최적화 기회
- 🧪 **테스트**: 누락된 테스트 케이스
- 📖 **가독성**: 코드 명확성, 주석, 문서화

### 워크플로우 상세

- **트리거**: PR 생성, 업데이트, 재오픈
- **대상 파일**: `.js`, `.jsx`, `.ts`, `.tsx`, `.py`, `.java`, `.go`, `.rs`, `.rb`, `.php`
- **AI 모델**: Claude Sonnet 4.5
- **비용**: 파일당 약 $0.01-0.05 (토큰 사용량에 따라 변동)

### 워크플로우 비활성화

AI 코드 리뷰를 일시적으로 비활성화하려면:

```bash
# .github/workflows/code-review.yml 파일 삭제 또는
git mv .github/workflows/code-review.yml .github/workflows/code-review.yml.disabled
```

## 🤝 기여하기

기여를 환영합니다! 🎉

> 📖 **상세 가이드**: [CONTRIBUTING.md](./CONTRIBUTING.md)에서 전체 기여 프로세스와 코딩 가이드라인을 확인하세요.

### 빠른 시작

```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/YOUR_USERNAME/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 의존성 설치 및 Git Hooks 설정
yarn install
yarn prepare

# 3. 기능 브랜치 생성
git checkout -b feature/your-feature

# 4. 개발 및 테스트
yarn dev
yarn test

# 5. 커밋 (Conventional Commits 형식)
git commit -m "feat(client): add amazing feature"

# 6. 푸시 및 PR 생성
git push origin feature/your-feature
```

### 주요 규칙

- ✅ **Conventional Commits** 형식 필수
- ✅ **ESLint** 및 **Prettier** 규칙 준수 (자동 검사)
- ✅ **타입 안전성**: TypeScript strict 모드
- ✅ **테스트 통과** 필수
- ✅ **코드 리뷰** 승인 후 머지

더 자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참조하세요.

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 팀

- **개발자 1**: 크롤링 및 가격 분석
- **개발자 2**: 판매자 분석 및 리뷰 분석
- **개발자 3**: AI 통합 및 프론트엔드

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

- GitHub Issues: [https://github.com/your-repo/shopping-fraud-detector/issues](https://github.com/your-repo/shopping-fraud-detector/issues)

## 🙏 감사의 말

- [Anthropic Claude](https://www.anthropic.com/) - Claude API
- [AWS Bedrock](https://aws.amazon.com/bedrock/) - AI 모델 제공
- [Cheerio](https://cheerio.js.org/) - HTML 파싱
- [React](https://react.dev/) - UI 프레임워크

---

⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!

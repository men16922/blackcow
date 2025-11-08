# 🛡️ 쇼핑 흑우 감별사 #

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
- **AI/ML**: AWS Bedrock Claude Sonnet 4.0 / Claude API / Ollama
- **Crawler**: Cheerio, Axios
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Chart.js (Phase 2)

### DevOps
- **Deployment**: AWS Lightsail
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **Container**: Docker (로컬 개발)

## 🏗 아키텍처

![아키텍처 다이어그램](.kiro/specs/shopping-fraud-detector/architecture_updated.png)

### 배포 구성

- **AWS Lightsail** ($5/월): 단일 서버 (Nginx + Node.js + Express)
- **AWS DynamoDB** (무료 티어): NoSQL 데이터베이스
- **AI 프로바이더** (선택 가능):
  - AWS Bedrock (프로덕션)
  - Claude API (로컬 개발)
  - Ollama (로컬 무료)

### 비용

- **MVP**: $7-9/월
- **Phase 2**: $8-11/월
- **Phase 3**: $8-12/월

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- AWS 계정 (프로덕션 배포 시)
- Claude API Key 또는 Ollama (로컬 개발 시)

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
nano .env.local

# 4. Docker 서비스 시작 (DynamoDB + Ollama)
docker-compose -f docker-compose.local.yml up -d

# 5. 로컬 환경 설정
npm run setup:local

# 6. 개발 서버 시작
npm run dev
```

### 환경 변수 설정

```bash
# .env.local
NODE_ENV=development
PORT=3000
CLIENT_PORT=3001

# AI 프로바이더 선택 (하나만 선택)
AI_PROVIDER=claude  # 'bedrock', 'claude', 또는 'local'

# Claude API (권장 - 로컬 개발)
CLAUDE_API_KEY=sk-ant-api03-your-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# 또는 Ollama (무료)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# 또는 AWS Bedrock (프로덕션)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0

# DynamoDB
DYNAMODB_ENDPOINT=http://localhost:8000
```

## 💻 로컬 개발

### AI 프로바이더 선택

#### Option 1: Claude API (가장 간편) ⭐

```bash
# 1. API Key 발급: https://console.anthropic.com
# 2. .env.local 설정
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-xxx

# 3. 개발 서버 시작
npm run dev
```

**장점**: API Key만으로 즉시 사용, 높은 품질  
**비용**: 신규 가입 시 $5 무료 크레딧, 이후 $0.003/1K 토큰

#### Option 2: Ollama (완전 무료)

```bash
# 1. 모델 다운로드
ollama pull qwen2.5:7b

# 2. .env.local 설정
AI_PROVIDER=local
OLLAMA_MODEL=qwen2.5:7b

# 3. 개발 서버 시작
npm run dev
```

**장점**: 완전 무료, 오프라인 사용 가능  
**요구사항**: 8GB RAM, 3-5GB 디스크

#### Option 3: AWS Bedrock (프로덕션)

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

**장점**: 프로덕션 안정성, AWS 통합  
**요구사항**: AWS 계정, IAM 권한

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

상세 가이드: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)

## 🚢 배포

### AWS Lightsail 배포

```bash
# 1. Lightsail 인스턴스 생성 ($5/월)
# - OS: Ubuntu 20.04
# - RAM: 1GB
# - SSD: 40GB

# 2. 서버 접속
ssh ubuntu@your-lightsail-ip

# 3. 배포 스크립트 실행
curl -fsSL https://raw.githubusercontent.com/your-repo/shopping-fraud-detector/main/scripts/deploy.sh | bash

# 4. 환경 변수 설정
sudo nano /opt/shopping-fraud-detector/.env

# 5. 서비스 시작
pm2 start ecosystem.config.js
pm2 save
```

### DynamoDB 설정

```bash
# 로컬 개발
npm run setup:dynamodb

# 프로덕션 (AWS Console)
# 1. DynamoDB 콘솔 접속
# 2. 테이블 생성: Products, AnalysisResults, PriceHistory, FraudReports
# 3. On-Demand 모드 선택
```

## 📁 프로젝트 구조

```
shopping-fraud-detector/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지
│   │   └── services/      # API 클라이언트
│   └── package.json
│
├── server/                 # Express 백엔드
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # 데이터 모델
│   │   ├── db/            # DynamoDB 클라이언트
│   │   └── middleware/    # 미들웨어
│   └── package.json
│
├── docs/                   # 문서
│   └── LOCAL_DEVELOPMENT.md
│
├── .kiro/specs/           # 설계 문서
│   └── shopping-fraud-detector/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
├── docker-compose.local.yml
├── ecosystem.config.js    # PM2 설정
├── nginx.conf             # Nginx 설정
└── README.md
```

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
npm test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지
npm run test:coverage
```

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인

- ESLint 규칙 준수
- 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/) 형식 사용
- 모든 PR은 테스트 통과 필수
- 코드 리뷰 후 머지

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

- [AWS Bedrock](https://aws.amazon.com/bedrock/) - AI 모델 제공
- [Anthropic Claude](https://www.anthropic.com/) - Claude API
- [Ollama](https://ollama.com/) - 로컬 LLM 지원
- [Cheerio](https://cheerio.js.org/) - HTML 파싱
- [React](https://react.dev/) - UI 프레임워크

---

⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!

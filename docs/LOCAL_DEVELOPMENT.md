# 로컬 개발 환경 가이드

## 개요

이 문서는 여러 개발자가 독립적으로 작업할 수 있는 로컬 개발 환경 설정 방법을 설명합니다.

## 주요 특징

- ✅ **독립적인 환경**: 개발자별 포트와 데이터 격리
- ✅ **로컬 LLM 지원**: AWS Bedrock 없이도 개발 가능
- ✅ **Docker 기반**: 간편한 설정 및 관리
- ✅ **멀티 프로바이더**: Bedrock, Ollama 자유롭게 전환

## 빠른 시작

### 1. 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- Git

### 2. 초기 설정

```bash
# 저장소 클론
git clone https://github.com/your-repo/shopping-fraud-detector.git
cd shopping-fraud-detector

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발자별 포트 설정 (충돌 방지)
nano .env.local
```

### 3. 환경 변수 설정 (.env.local)

```bash
# 개발자 정보
DEVELOPER_NAME=developer1

# 포트 설정 (개발자별 다르게!)
PORT=3000              # Backend 포트
CLIENT_PORT=3001       # Frontend 포트
DYNAMODB_PORT=8000     # DynamoDB 포트
OLLAMA_PORT=11434      # Ollama 포트

# AI 프로바이더 선택
AI_PROVIDER=local      # 'local' 또는 'bedrock'

# Ollama 설정 (로컬 개발용)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# DynamoDB 설정
DYNAMODB_ENDPOINT=http://localhost:8000
```

### 4. Docker 서비스 시작

```bash
# DynamoDB + Ollama 시작
docker-compose -f docker-compose.local.yml up -d

# 상태 확인
docker-compose -f docker-compose.local.yml ps
```

### 5. 로컬 환경 설정

```bash
# DynamoDB 테이블 생성 + Ollama 모델 다운로드
npm run setup:local

# 또는 개별 실행
npm run setup:dynamodb
npm run setup:ollama
```

### 6. 개발 서버 시작

```bash
# 백엔드 (터미널 1)
cd server
npm run dev

# 프론트엔드 (터미널 2)
cd client
npm start
```

## 개발자별 포트 할당

충돌을 방지하기 위해 개발자별로 다른 포트를 사용하세요:

| 개발자 | Backend | Frontend | DynamoDB | Ollama |
|--------|---------|----------|----------|--------|
| Dev 1  | 3000    | 3001     | 8000     | 11434  |
| Dev 2  | 3010    | 3011     | 8010     | 11444  |
| Dev 3  | 3020    | 3021     | 8020     | 11454  |
| Dev 4  | 3030    | 3031     | 8030     | 11464  |

## AI 프로바이더 선택

### 빠른 비교표

| 항목 | Claude API | Ollama (Qwen) | AWS Bedrock |
|------|-----------|---------------|-------------|
| 설정 난이도 | ⭐ 매우 쉬움 | ⭐⭐ 보통 | ⭐⭐⭐ 어려움 |
| 비용 | $0.003/1K 토큰 | 무료 | $0.003/1K 토큰 |
| 응답 속도 | 1-2초 | 2-5초 | 1-2초 |
| 한국어 품질 | 우수 | 우수 | 우수 |
| 오프라인 | ❌ | ✅ | ❌ |
| 필요 사항 | API Key | Docker, 8GB RAM | AWS 계정 |
| 권장 용도 | 로컬 개발 | 완전 무료 개발 | 프로덕션 |

### Option 1: Claude API (로컬 개발 - 가장 간편) - 권장

**장점**:
- API Key만으로 간편 설정
- AWS 계정 불필요
- 높은 품질 (Bedrock과 동일)
- 빠른 응답 속도

**단점**:
- 비용 발생 ($0.003/1K 토큰)
- 인터넷 연결 필수
- 월 $5 무료 크레딧 (신규 가입 시)

**설정**:
```bash
# .env.local
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-api03-xxx  # https://console.anthropic.com에서 발급
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**API Key 발급**:
1. https://console.anthropic.com 접속
2. 계정 생성 (신규 가입 시 $5 무료 크레딧)
3. API Keys 메뉴에서 새 키 생성
4. `.env.local`에 키 추가

### Option 2: Ollama (로컬 LLM - 완전 무료)

**장점**:
- 완전 무료
- 오프라인 사용 가능
- AWS 계정 불필요
- API Key 불필요

**단점**:
- 초기 모델 다운로드 필요 (3-5GB)
- RAM 8GB 이상 권장
- 응답 속도 느림 (2-5초)

**설정**:
```bash
# .env.local
AI_PROVIDER=local
OLLAMA_MODEL=qwen2.5:7b  # 한국어 우수
```

**지원 모델**:
- `qwen2.5:7b` - 한국어 우수, 8GB RAM 필요 (권장)
- `qwen2.5:3b` - 경량 버전, 4GB RAM
- `gpt-oss` - 경량 대안

### Option 3: AWS Bedrock (프로덕션)

**장점**:
- 높은 품질
- 빠른 응답 속도
- 인프라 관리 불필요

**단점**:
- 비용 발생 ($0.003/1K 토큰)
- AWS 계정 필요
- 인터넷 연결 필수

**설정**:
```bash
# .env.local
AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
```

## Ollama 상세 가이드

### 모델 다운로드

```bash
# Qwen 2.5 (권장)
ollama pull qwen2.5:7b

# 또는 경량 버전
ollama pull qwen2.5:3b

# GPT-OSS (대안)
ollama pull gpt-oss
```

### 모델 테스트

```bash
# 대화형 테스트
ollama run qwen2.5:7b

# API 테스트
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "안녕하세요",
  "stream": false
}'
```

### 모델 관리

```bash
# 설치된 모델 확인
ollama list

# 모델 삭제
ollama rm qwen2.5:7b

# 모델 업데이트
ollama pull qwen2.5:7b
```

## 일일 워크플로우

### 아침: 작업 시작

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. Docker 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 3. 개발 서버 시작
npm run dev
```

### 저녁: 작업 종료

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: 기능 구현"
git push origin feature/your-feature

# 2. Docker 서비스 중지 (선택사항)
docker-compose -f docker-compose.local.yml down
```

## 트러블슈팅

### Ollama 연결 실패

```bash
# 1. Ollama 실행 확인
curl http://localhost:11434/api/tags

# 2. Docker 컨테이너 확인
docker ps | grep ollama

# 3. 로그 확인
docker logs shopping-fraud-ollama-${USER}

# 4. 재시작
docker-compose -f docker-compose.local.yml restart ollama
```

### DynamoDB 연결 실패

```bash
# 1. DynamoDB 실행 확인
aws dynamodb list-tables --endpoint-url http://localhost:8000

# 2. 테이블 재생성
npm run setup:dynamodb

# 3. 재시작
docker-compose -f docker-compose.local.yml restart dynamodb-local
```

### 포트 충돌

```bash
# 1. 사용 중인 포트 확인
lsof -i :3000
lsof -i :8000

# 2. .env.local에서 다른 포트로 변경
PORT=3010
DYNAMODB_PORT=8010

# 3. 서버 재시작
npm run dev
```

### 모델 다운로드 실패

```bash
# 1. Ollama 서버 재시작
docker-compose -f docker-compose.local.yml restart ollama

# 2. 수동 다운로드
docker exec -it shopping-fraud-ollama-${USER} ollama pull qwen2.5:7b

# 3. 디스크 공간 확인
df -h
```

## 유용한 명령어

### Docker 관리

```bash
# 모든 서비스 시작
docker-compose -f docker-compose.local.yml up -d

# 특정 서비스만 시작
docker-compose -f docker-compose.local.yml up -d ollama

# 서비스 중지
docker-compose -f docker-compose.local.yml down

# 로그 확인
docker-compose -f docker-compose.local.yml logs -f

# 볼륨 삭제 (데이터 초기화)
docker-compose -f docker-compose.local.yml down -v
```

### DynamoDB 관리

```bash
# 테이블 목록
aws dynamodb list-tables --endpoint-url http://localhost:8000

# 테이블 스캔
aws dynamodb scan --table-name Products --endpoint-url http://localhost:8000

# 테이블 삭제
aws dynamodb delete-table --table-name Products --endpoint-url http://localhost:8000
```

### Ollama 관리

```bash
# 모델 목록
ollama list

# 모델 실행
ollama run qwen2.5:7b

# 모델 삭제
ollama rm qwen2.5:7b
```

## 성능 최적화

### Ollama 성능 향상

```bash
# GPU 사용 (NVIDIA GPU 있는 경우)
docker-compose -f docker-compose.local.yml up -d ollama --gpus all

# 메모리 제한 해제
docker update --memory 8g shopping-fraud-ollama-${USER}
```

### DynamoDB 성능 향상

```bash
# 메모리 증가
docker update --memory 2g shopping-fraud-dynamodb-${USER}
```

## FAQ

### Q: 어떤 AI 프로바이더를 선택해야 하나요?

A: 상황에 따라 선택하세요:
- **빠른 시작**: Claude API (API Key만 필요)
- **완전 무료**: Ollama (초기 설정 필요)
- **프로덕션**: AWS Bedrock (AWS 계정 필요)

### Q: Ollama 모델이 너무 느려요

A: 다음을 확인하세요:
1. RAM이 충분한지 (최소 8GB)
2. 더 작은 모델 사용 (`qwen2.5:3b`)
3. GPU 사용 가능 여부
4. 또는 Claude API로 전환 (빠른 응답)

### Q: Claude API 비용이 걱정돼요

A: 다음을 참고하세요:
- 신규 가입 시 $5 무료 크레딧
- 월 10,000 요청 기준 약 $2-4
- 캐싱으로 80-90% 비용 절감
- 개발 중에는 Ollama 사용 권장

### Q: 프로바이더를 동시에 사용할 수 있나요?

A: 네, `.env.local`에서 `AI_PROVIDER`를 변경하면 즉시 전환됩니다.
```bash
# Claude API로 전환
AI_PROVIDER=claude

# Ollama로 전환
AI_PROVIDER=local

# Bedrock으로 전환
AI_PROVIDER=bedrock
```

### Q: 다른 개발자와 데이터를 공유하고 싶어요

A: DynamoDB 데이터를 export/import하거나, 공용 DynamoDB 인스턴스를 사용하세요.

### Q: 프로덕션 배포 시 설정은?

A: `.env` 파일에서 `AI_PROVIDER=bedrock`으로 설정하고 AWS 자격 증명을 추가하세요.

## 추가 리소스

- [Ollama 공식 문서](https://ollama.com/docs)
- [Qwen 모델 정보](https://huggingface.co/Qwen)
- [DynamoDB Local 가이드](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS Bedrock 문서](https://docs.aws.amazon.com/bedrock/)

# MCP (Model Context Protocol) 가이드

쇼핑 흑우 감별사 프로젝트에서 유용한 MCP 서버 목록과 사용 가이드입니다.

## 현재 사용 중인 MCP

### 1. GitHub MCP ✅
**용도**: GitHub API 작업 자동화

**주요 기능**:
- PR 생성/수정/머지
- Issue 관리
- 코드 리뷰 자동화
- Repository 정보 조회

**사용 예시**:
- PR 생성 및 자동 리뷰 요청
- Issue 생성 및 라벨링
- Branch 관리
- Commit 히스토리 조회

### 2. Playwright MCP ✅
**용도**: 웹 크롤링 및 E2E 테스트

**주요 기능**:
- 동적 웹페이지 크롤링
- 스크린샷 캡처
- 브라우저 자동화
- E2E 테스트

**프로젝트 활용**:
- 쿠팡/네이버쇼핑/11번가 상품 크롤링
- 상품 정보 추출 자동화
- 크롤링 테스트

## 추천 MCP 목록

### 3. AWS MCP 🔥 강력 추천
**용도**: AWS 리소스 관리

**주요 기능**:
- DynamoDB 테이블 관리
- Lightsail 인스턴스 모니터링
- CloudWatch 로그 조회
- IAM 권한 관리

**프로젝트 활용**:
- DynamoDB 테이블 스키마 확인
- 배포 상태 모니터링
- 로그 실시간 조회

**설치**:
```bash
# MCP 설정 파일에 추가
{
  "mcpServers": {
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"]
    }
  }
}
```

### 4. Docker MCP 🔥 강력 추천
**용도**: Docker 컨테이너 관리

**주요 기능**:
- 컨테이너 상태 확인
- 이미지 빌드/실행
- 로그 조회
- 컨테이너 디버깅

**프로젝트 활용**:
- 로컬 DynamoDB 컨테이너 관리
- 개발 환경 컨테이너 확인
- 배포 전 Docker 빌드 테스트

### 5. Filesystem MCP
**용도**: 파일 시스템 작업

**주요 기능**:
- 파일 읽기/쓰기
- 디렉토리 탐색
- 파일 검색
- 대용량 파일 처리

**프로젝트 활용**:
- 로그 파일 분석
- 설정 파일 자동 수정
- 백업 파일 관리

### 6. Postgres/SQLite MCP
**용도**: 데이터베이스 작업 (향후 필요 시)

**주요 기능**:
- SQL 쿼리 실행
- 스키마 관리
- 데이터 마이그레이션

**참고**: 현재는 DynamoDB를 사용하므로 필요 없음. AWS MCP로 대체 가능.

## MCP 설정 방법

### Claude Desktop 설정

1. Claude Desktop 설정 파일 열기:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. MCP 서버 추가:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@automatalabs/mcp-server-playwright"]
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_PROFILE": "default",
        "AWS_REGION": "ap-northeast-2"
      }
    },
    "docker": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/docker"]
    }
  }
}
```

3. Claude Desktop 재시작

## 프로젝트별 활용 시나리오

### 시나리오 1: 상품 크롤링 개발
```
1. Playwright MCP로 쿠팡 상품 페이지 크롤링 테스트
2. Filesystem MCP로 크롤링 결과 JSON 저장
3. GitHub MCP로 PR 생성 및 리뷰 요청
```

### 시나리오 2: 배포 및 모니터링
```
1. Docker MCP로 로컬 빌드 테스트
2. AWS MCP로 Lightsail 인스턴스 상태 확인
3. AWS MCP로 CloudWatch 로그 조회
4. GitHub MCP로 배포 이슈 생성
```

### 시나리오 3: 데이터베이스 작업
```
1. AWS MCP로 DynamoDB 테이블 스키마 확인
2. AWS MCP로 데이터 쿼리
3. Filesystem MCP로 백업 파일 생성
```

## 주의사항

### 보안
- API 키/토큰은 절대 Git에 커밋하지 마세요
- 환경 변수로 민감 정보 관리
- MCP 설정 파일은 `.gitignore`에 추가

### 성능
- 대용량 크롤링은 Rate Limiting 고려
- AWS MCP 사용 시 비용 모니터링
- Docker MCP는 로컬 개발에만 사용

### 디버깅
- MCP 로그는 Claude Desktop Console에서 확인
- 연결 실패 시 MCP 서버 재시작
- npx 캐시 문제 시 `npx clear-npx-cache` 실행

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [GitHub MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Playwright MCP](https://github.com/automata-labs/mcp-server-playwright)
- [MCP 서버 목록](https://github.com/modelcontextprotocol/servers)

## 추가 추천 MCP (선택사항)

- **Slack MCP**: 팀 알림 자동화
- **Sentry MCP**: 에러 모니터링 통합
- **Datadog MCP**: APM 및 로그 통합 (프로덕션 환경)

---

**팁**: 처음에는 현재 사용 중인 GitHub, Playwright만으로 시작하고, 필요할 때 AWS, Docker MCP를 추가하는 것을 권장합니다.

# Claude Code Settings

쇼핑 흑우 감별사 프로젝트의 Claude Code 설정입니다.

## 프로젝트 컨텍스트

이 프로젝트는 AI 기반 온라인 쇼핑 사기 탐지 서비스입니다.

### 기술 스택

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js 18, Express, TypeScript
- **Database**: AWS DynamoDB
- **AI**: Claude API (Anthropic SDK)
- **Monorepo**: Turborepo, Yarn Workspaces

### 주요 디렉토리

- `apps/client/`: React 프론트엔드
- `apps/server/`: Express 백엔드
- `packages/shared/`: 공통 타입 및 유틸리티
- `scripts/`: 배포 및 유틸리티 스크립트
- `infra/`: 인프라 코드 (Docker, Terraform, Lightsail)

## 코딩 가이드라인

### TypeScript

- 모든 코드는 TypeScript로 작성
- `any` 타입 사용 금지
- 공통 타입은 `packages/shared/src/types`에 정의
- Strict 모드 준수

### 네이밍 컨벤션

- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일 (컴포넌트): PascalCase
- 파일 (유틸리티): kebab-case

### 커밋 메시지

- Conventional Commits 형식 필수
- 형식: `<type>(<scope>): <description>`
- 타입: feat, fix, docs, style, refactor, test, chore

## Claude Code 동작 규칙

### 파일 수정 시

1. 기존 파일 수정 우선 (새 파일 생성 최소화)
2. 타입 정의는 `packages/shared`에 추가
3. 변경 전 관련 파일 먼저 읽기

### 코드 작성 시

1. TypeScript strict 모드 준수
2. 에러 처리 필수 (try-catch)
3. 로깅 추가 (Winston 사용)
4. 보안 검증 (입력 검증, API 키 환경 변수)

### AI 관련 작업 시

1. Claude API 토큰 사용 최적화
2. 프롬프트 명확하게 작성
3. 응답 타입 검증
4. 에러 핸들링 철저히

### 인프라 작업 시

1. Docker 파일은 multi-stage build 사용
2. 환경 변수는 .env.example에 예시 추가
3. 스크립트는 실행 권한 부여 필요
4. 문서화 필수

## 보안 정책

### 금지 사항

- API 키를 코드에 하드코딩
- .env 파일을 Git에 커밋
- 민감한 정보를 로그에 출력
- SQL/NoSQL 인젝션 취약점 생성

### 필수 사항

- 모든 입력 검증 (Zod 사용)
- 환경 변수로 민감 정보 관리
- Rate limiting 적용
- CORS 설정
- Helmet 사용 (보안 헤더)

## 성능 최적화

### 프론트엔드

- 불필요한 리렌더링 방지 (React.memo, useMemo, useCallback)
- 코드 스플리팅 적용
- 이미지 최적화

### 백엔드

- DynamoDB 쿼리 최적화 (인덱스 활용)
- Claude API 호출 최소화 (캐싱)
- 비동기 처리 적절히 사용

## 테스트

### 필수 테스트

- 단위 테스트: 비즈니스 로직
- 통합 테스트: API 엔드포인트
- 타입 체크: 전체 프로젝트

### 테스트 커버리지

- 최소 70% 이상 권장
- 중요 비즈니스 로직은 100%

## 문서화

### README 업데이트 필요 시

- 새로운 환경 변수 추가
- 설치 단계 변경
- 새로운 스크립트 추가

### CLAUDE.md 업데이트 필요 시

- 코딩 가이드라인 변경
- 프로젝트 구조 변경
- 배포 프로세스 변경

## 특별 지시사항

### Turborepo 사용 시

- 워크스페이스 의존성 주의
- 공유 설정 활용 (typescript-config, eslint-config)
- 빌드 순서 고려

### 모노레포 구조

- packages 간 순환 의존성 금지
- shared 패키지 적극 활용
- 타입 변경 시 영향 범위 확인

### Claude API 사용

- 모델: claude-3-5-sonnet-20241022
- 토큰 제한: 1024 (조정 가능)
- Temperature: 0.3 (분석 작업)
- 응답 검증 필수

## 커스텀 명령어

프로젝트에 특화된 작업들:

### 개발

```bash
yarn dev              # 전체 개발 서버 실행
yarn build            # 전체 빌드
yarn lint             # 전체 린트 검사
yarn type-check       # 전체 타입 체크
```

### 배포

```bash
./scripts/deploy.sh           # 프로덕션 배포
./scripts/health-check.sh     # 헬스체크
./scripts/backup.sh           # 백업
```

### 인프라

```bash
docker-compose -f infra/docker/docker-compose.yml up    # Docker 실행
terraform -chdir=infra/terraform apply                  # Terraform 배포
./infra/lightsail/setup.sh                             # Lightsail 설정
```

## 추가 참고 자료

- [CLAUDE.md](../CLAUDE.md): 전체 프로젝트 가이드
- [CONTRIBUTING.md](../CONTRIBUTING.md): 기여 가이드
- [README.md](../README.md): 프로젝트 개요
- [.claude/agents/](./agents/): 특화 에이전트 프롬프트

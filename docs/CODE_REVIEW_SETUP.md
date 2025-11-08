# AI 코드 리뷰 설정 가이드

AI 기반 자동 코드 리뷰를 설정하는 방법을 상세히 안내합니다.

## 📋 목차

- [개요](#개요)
- [사전 요구사항](#사전-요구사항)
- [설정 단계](#설정-단계)
- [워크플로우 커스터마이징](#워크플로우-커스터마이징)
- [비용 관리](#비용-관리)
- [문제 해결](#문제-해결)

## 개요

이 프로젝트는 GitHub Actions와 Claude AI를 활용한 자동 코드 리뷰 시스템을 제공합니다.

### 주요 기능

- ✅ Pull Request 생성 시 자동 트리거
- 🔍 변경된 파일만 선택적으로 분석
- 🤖 Claude Sonnet 4.5를 사용한 고품질 리뷰
- 💬 PR에 자동으로 리뷰 코멘트 추가
- 📊 요약 리포트 자동 생성

### 리뷰 범위

다음 파일 타입을 자동으로 검사합니다:

- JavaScript/TypeScript: `.js`, `.jsx`, `.ts`, `.tsx`
- Python: `.py`
- Java: `.java`
- Go: `.go`
- Rust: `.rs`
- Ruby: `.rb`
- PHP: `.php`

## 사전 요구사항

### 1. GitHub Repository

- Repository에 대한 Admin 권한
- GitHub Actions 활성화 (기본값: 활성화)

### 2. Anthropic API Key

Claude AI를 사용하기 위한 API Key가 필요합니다.

#### API Key 발급 방법

1. [Anthropic Console](https://console.anthropic.com) 접속
2. 계정 생성 또는 로그인
3. **API Keys** 메뉴로 이동
4. **Create Key** 버튼 클릭
5. Key 이름 입력 (예: `blackcow-code-review`)
6. API Key 복사 (한 번만 표시됨!)

#### 요금제

- **신규 가입**: $5 무료 크레딧 제공
- **Claude 3.5 Sonnet**: $0.003/1K input tokens, $0.015/1K output tokens
- **예상 비용**: PR당 평균 $0.05-0.20 (파일 수와 크기에 따라 변동)

## 설정 단계

### Step 1: GitHub Secret 추가

1. GitHub Repository 페이지로 이동
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables > Actions** 선택
4. **New repository secret** 버튼 클릭
5. 다음 정보 입력:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Secret**: 발급받은 API Key (예: `sk-ant-api03-xxx...`)
6. **Add secret** 버튼 클릭

### Step 2: 워크플로우 확인

이미 `.github/workflows/code-review.yml` 파일이 생성되어 있습니다.

```bash
# 워크플로우 파일 확인
cat .github/workflows/code-review.yml
```

### Step 3: 테스트 PR 생성

설정이 올바른지 확인하기 위해 테스트 PR을 생성합니다:

```bash
# 새 브랜치 생성
git checkout -b test/code-review

# 테스트 파일 생성
echo "console.log('test');" > test.js
git add test.js
git commit -m "test: AI 코드 리뷰 테스트"

# Push
git push origin test/code-review
```

GitHub에서 PR을 생성하면 자동으로 AI 코드 리뷰가 실행됩니다.

### Step 4: 결과 확인

1. PR 페이지로 이동
2. **Checks** 탭에서 `AI Code Review` 워크플로우 확인
3. 워크플로우 완료 후 **Conversation** 탭에서 리뷰 코멘트 확인

## 워크플로우 커스터마이징

### 리뷰 대상 파일 변경

`.github/workflows/code-review.yml` 파일에서 `files` 섹션을 수정:

```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v41
  with:
    files: |
      **/*.js
      **/*.jsx
      # 원하는 파일 패턴 추가
      **/*.vue
      **/*.svelte
```

### AI 프롬프트 커스터마이징

`review.js` 스크립트 내의 프롬프트를 수정하여 리뷰 포커스를 변경할 수 있습니다:

```javascript
content: `You are an expert code reviewer for an e-commerce fraud detection system.

Focus specifically on:
1. Security vulnerabilities in payment processing
2. Data validation for user inputs
3. Error handling in API endpoints
4. Performance issues in database queries

File: ${file}
...`
```

### Rate Limiting 조정

API 요청 간격을 조정하려면:

```javascript
// 현재: 2초 대기
await new Promise(resolve => setTimeout(resolve, 2000));

// 더 빠르게: 1초 대기
await new Promise(resolve => setTimeout(resolve, 1000));

// 더 느리게: 5초 대기
await new Promise(resolve => setTimeout(resolve, 5000));
```

## 비용 관리

### 예상 비용 계산

| 파일 수 | 평균 파일 크기 | 예상 토큰 수 | 예상 비용 |
|--------|------------|------------|---------|
| 1-3개  | ~100 lines | ~5K tokens | $0.05   |
| 4-10개 | ~100 lines | ~20K tokens| $0.15   |
| 11-20개| ~100 lines | ~40K tokens| $0.30   |

### 비용 절감 팁

1. **대규모 PR 분할**: 파일이 많은 경우 여러 PR로 분할
2. **파일 필터링**: 중요한 파일 타입만 리뷰 대상으로 설정
3. **Draft PR 활용**: Draft PR에서는 리뷰 스킵 (아래 설정 참고)

#### Draft PR에서 리뷰 스킵

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    # Draft PR 제외
    branches-ignore:
      - 'draft/**'
```

### 사용량 모니터링

Anthropic Console에서 API 사용량을 모니터링할 수 있습니다:

1. [Anthropic Console](https://console.anthropic.com) 접속
2. **Usage** 탭 클릭
3. 일별/월별 사용량 확인

## 문제 해결

### 워크플로우가 실행되지 않는 경우

**원인 1: API Key가 설정되지 않음**

```bash
# GitHub Actions 로그 확인
# Error: ANTHROPIC_API_KEY is not set
```

**해결**: [Step 1](#step-1-github-secret-추가)에 따라 Secret 추가

---

**원인 2: 권한 문제**

```bash
# Error: Resource not accessible by integration
```

**해결**: `.github/workflows/code-review.yml`의 `permissions` 확인:

```yaml
permissions:
  contents: read
  pull-requests: write
```

---

**원인 3: 워크플로우가 비활성화됨**

**해결**:
1. GitHub Repository > **Actions** 탭
2. 좌측에서 "AI Code Review" 워크플로우 선택
3. **Enable workflow** 버튼 클릭

### 리뷰 코멘트가 표시되지 않는 경우

**원인: API 요청 실패**

**해결**: GitHub Actions 로그 확인:

1. PR 페이지 > **Checks** 탭
2. "AI Code Review" 워크플로우 클릭
3. "AI Code Review" 스텝의 로그 확인
4. 에러 메시지 확인

일반적인 에러:

- `401 Unauthorized`: API Key가 잘못됨
- `429 Too Many Requests`: Rate limit 초과
- `500 Internal Server Error`: Claude API 장애

### Rate Limit 초과

```bash
Error: 429 Too Many Requests
```

**해결**:

1. Rate limiting 대기 시간 증가 (2초 → 5초)
2. 파일별로 순차 처리 (이미 구현됨)
3. Anthropic에 Rate Limit 증가 요청

### 대규모 PR 처리

파일이 20개 이상인 경우:

**옵션 1: 워크플로우 타임아웃 증가**

```yaml
jobs:
  code-review:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # 기본값: 360 (6시간)
```

**옵션 2: 파일 수 제한**

```javascript
// review.js 스크립트 수정
const MAX_FILES = 15;
const filesToReview = changedFiles.slice(0, MAX_FILES);

if (changedFiles.length > MAX_FILES) {
  console.log(`Reviewing first ${MAX_FILES} files out of ${changedFiles.length}`);
}
```

## 고급 설정

### Multi-Model 리뷰

여러 AI 모델을 사용하여 다각도 리뷰:

```javascript
const models = [
  'claude-3-5-sonnet-20241022',    // 균형잡힌 리뷰
  'claude-3-opus-20240229'         // 깊이 있는 리뷰
];

for (const model of models) {
  const review = await anthropic.messages.create({
    model,
    // ...
  });
}
```

### 자동 수정 제안

코드 수정 제안을 포함한 리뷰:

```javascript
content: `Analyze the code and provide specific fix suggestions.

For each issue, provide:
1. Issue description
2. Exact code to fix
3. Suggested replacement code

Format:
\`\`\`suggestion
// suggested code here
\`\`\`
`
```

### Slack 알림 통합

리뷰 완료 시 Slack으로 알림:

```yaml
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "AI Code Review completed for PR #${{ github.event.pull_request.number }}"
      }
```

## 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Anthropic API 문서](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Claude 3.5 Sonnet 모델 가이드](https://www.anthropic.com/claude)

## 기여

코드 리뷰 워크플로우 개선 아이디어가 있으시면 Issue나 PR을 등록해주세요!

---

**문의사항이 있으시면 GitHub Issues에 등록해주세요.**

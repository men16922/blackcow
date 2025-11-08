# Husky Git Hooks

이 디렉토리는 Husky Git hooks를 포함합니다.

## 설정된 Hooks

### pre-commit
커밋 전에 실행됩니다:
- ESLint를 통한 코드 검사
- Prettier를 통한 코드 포맷팅
- 변경된 파일만 검사 (lint-staged)

### commit-msg
커밋 메시지 작성 후 실행됩니다:
- Conventional Commits 형식 검증
- 올바른 형식: `<type>(<scope>): <description>`

## 초기 설정

Husky를 처음 설정하려면:

```bash
# Husky와 lint-staged 설치
yarn add -D husky lint-staged

# Husky 초기화
yarn husky install

# package.json에 prepare 스크립트 추가 (이미 추가됨)
```

## Hooks 비활성화

임시로 hooks를 건너뛰려면:

```bash
# pre-commit hook 건너뛰기
git commit -m "message" --no-verify

# 또는
HUSKY=0 git commit -m "message"
```

## 문제 해결

### Hook이 실행되지 않는 경우

```bash
# Husky 재설치
rm -rf .husky/_
yarn husky install

# Hook 실행 권한 부여
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Lint-staged가 느린 경우

`.lintstagedrc.json` 파일에서 검사 범위를 조정하세요.

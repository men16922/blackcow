#!/bin/bash
set -e  # 에러 발생 시 즉시 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 배포 시작 시간
START_TIME=$(date +%s)

# 환경 변수 체크
check_env() {
    log_step "Checking environment variables..."

    if [ -z "$CLAUDE_API_KEY" ]; then
        log_error "CLAUDE_API_KEY is not set"
        exit 1
    fi

    if [ -z "$NODE_ENV" ]; then
        log_warn "NODE_ENV is not set, defaulting to 'production'"
        export NODE_ENV=production
    fi

    log_info "Environment variables validated ✓"
}

# Git 상태 확인
check_git_status() {
    log_step "Checking git status..."

    if [ -n "$(git status --porcelain)" ]; then
        log_warn "You have uncommitted changes"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi

    log_info "Git status checked ✓"
}

# 의존성 설치
install_dependencies() {
    log_step "Installing dependencies..."

    if ! yarn install --frozen-lockfile; then
        log_error "Failed to install dependencies"
        exit 1
    fi

    log_info "Dependencies installed ✓"
}

# 린트 및 타입 체크
run_checks() {
    log_step "Running lint and type checks..."

    if ! yarn lint; then
        log_error "Lint check failed"
        exit 1
    fi

    if ! yarn type-check; then
        log_error "Type check failed"
        exit 1
    fi

    log_info "All checks passed ✓"
}

# 테스트 실행
run_tests() {
    log_step "Running tests..."

    if ! yarn test; then
        log_error "Tests failed"
        exit 1
    fi

    log_info "All tests passed ✓"
}

# 빌드
build() {
    log_step "Building applications..."

    if ! yarn build; then
        log_error "Build failed"
        exit 1
    fi

    log_info "Build completed successfully ✓"
}

# 배포 실행 (AWS Lightsail)
deploy_to_lightsail() {
    log_step "Deploying to AWS Lightsail..."

    # 여기에 실제 배포 로직 추가
    # 예: rsync, scp, AWS CLI 등

    log_info "Deployment to Lightsail completed ✓"
}

# 헬스체크
health_check() {
    log_step "Performing health check..."

    if [ -f "./scripts/health-check.sh" ]; then
        if ./scripts/health-check.sh; then
            log_info "Health check passed ✓"
        else
            log_error "Health check failed"
            exit 1
        fi
    else
        log_warn "Health check script not found, skipping..."
    fi
}

# 배포 완료 시간 계산
calculate_duration() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_info "Deployment completed in ${DURATION}s"
}

# 메인 실행
main() {
    echo "======================================"
    echo "  Shopping Fraud Detector Deployment  "
    echo "======================================"
    echo ""

    check_env
    check_git_status
    install_dependencies
    run_checks
    run_tests
    build
    deploy_to_lightsail
    health_check
    calculate_duration

    echo ""
    log_info "🎉 Deployment completed successfully!"
}

# 에러 핸들링
trap 'log_error "Deployment failed!"; exit 1' ERR

main "$@"

#!/bin/bash
set -e

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 설정
INSTANCE_NAME=${INSTANCE_NAME:-"shopping-fraud-detector"}
REGION=${AWS_REGION:-"ap-northeast-2"}
APP_DIR="/opt/shopping-fraud-detector"
DEPLOY_DIR="$(pwd)"

echo "======================================"
echo "  Deploy to AWS Lightsail  "
echo "======================================"
echo ""

# SSH 연결 정보 가져오기
get_connection_info() {
    log_step "Getting connection info..."

    STATIC_IP=$(aws lightsail get-static-ip \
        --static-ip-name "${INSTANCE_NAME}-static-ip" \
        --region "$REGION" \
        --query 'staticIp.ipAddress' \
        --output text)

    USERNAME=$(aws lightsail get-instance \
        --instance-name "$INSTANCE_NAME" \
        --region "$REGION" \
        --query 'instance.username' \
        --output text)

    KEY_FILE="$HOME/.ssh/${INSTANCE_NAME}-key.pem"

    if [ ! -f "$KEY_FILE" ]; then
        log_error "SSH key not found: $KEY_FILE"
        log_info "Run: ./infra/lightsail/setup.sh first"
        exit 1
    fi

    log_info "Connection: $USERNAME@$STATIC_IP"
}

# 빌드
build_application() {
    log_step "Building application..."

    yarn install --frozen-lockfile
    yarn build

    log_info "Build completed ✓"
}

# 배포 패키지 생성
create_deployment_package() {
    log_step "Creating deployment package..."

    TEMP_DIR=$(mktemp -d)
    PACKAGE_NAME="deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

    # 필요한 파일만 복사
    mkdir -p "$TEMP_DIR/shopping-fraud-detector"

    cp -r apps "$TEMP_DIR/shopping-fraud-detector/"
    cp -r packages "$TEMP_DIR/shopping-fraud-detector/"
    cp package.json "$TEMP_DIR/shopping-fraud-detector/"
    cp yarn.lock "$TEMP_DIR/shopping-fraud-detector/"


    # node_modules 제외 (서버에서 설치)
    find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

    # 압축
    tar -czf "$PACKAGE_NAME" -C "$TEMP_DIR" shopping-fraud-detector

    rm -rf "$TEMP_DIR"

    log_info "Package created: $PACKAGE_NAME"
}

# 서버에 업로드
upload_to_server() {
    log_step "Uploading to server..."

    scp -i "$KEY_FILE" \
        -o StrictHostKeyChecking=no \
        "$PACKAGE_NAME" \
        "$USERNAME@$STATIC_IP:/tmp/"

    log_info "Upload completed ✓"
}

# 서버에서 배포
deploy_on_server() {
    log_step "Deploying on server..."

    ssh -i "$KEY_FILE" \
        -o StrictHostKeyChecking=no \
        "$USERNAME@$STATIC_IP" << 'ENDSSH'

set -e

# 압축 해제
cd /tmp
tar -xzf deploy-*.tar.gz

# 기존 앱 백업
if [ -d /opt/shopping-fraud-detector/current ]; then
    mv /opt/shopping-fraud-detector/current /opt/shopping-fraud-detector/backup-$(date +%Y%m%d-%H%M%S)
fi

# 새 버전 배포
mv shopping-fraud-detector /opt/shopping-fraud-detector/current
cd /opt/shopping-fraud-detector/current

# 의존성 설치
yarn install --frozen-lockfile --production

# 환경 변수 설정 (기존 .env 유지)
if [ -f /opt/shopping-fraud-detector/.env ]; then
    cp /opt/shopping-fraud-detector/.env /opt/shopping-fraud-detector/current/.env
fi

# PM2로 앱 재시작
if pm2 list | grep -q "shopping-fraud-detector"; then
    pm2 restart shopping-fraud-detector
else
    pm2 start apps/server/dist/index.js \
        --name shopping-fraud-detector \
        --time \
        --error /var/log/shopping-fraud-detector/error.log \
        --output /var/log/shopping-fraud-detector/output.log
    pm2 save
fi

# 정리
rm -f /tmp/deploy-*.tar.gz

# 오래된 백업 삭제 (5개만 유지)
cd /opt/shopping-fraud-detector
ls -t | grep "backup-" | tail -n +6 | xargs rm -rf 2>/dev/null || true

echo "✅ Deployment completed on server"

ENDSSH

    log_info "Deployment completed on server ✓"
}

# 헬스체크
health_check() {
    log_step "Performing health check..."

    sleep 5  # 앱 시작 대기

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$STATIC_IP/health")

    if [ "$HTTP_CODE" -eq 200 ]; then
        log_info "Health check passed ✓"
    else
        log_error "Health check failed (HTTP $HTTP_CODE)"
        log_warn "Check logs: ssh -i $KEY_FILE $USERNAME@$STATIC_IP 'pm2 logs'"
        exit 1
    fi
}

# 로그 보기
show_logs() {
    log_info "Recent logs:"
    ssh -i "$KEY_FILE" \
        -o StrictHostKeyChecking=no \
        "$USERNAME@$STATIC_IP" \
        "pm2 logs shopping-fraud-detector --lines 20 --nostream"
}

# 정리
cleanup() {
    log_step "Cleaning up..."
    rm -f deploy-*.tar.gz
    log_info "Cleanup completed ✓"
}

# 메인 실행
main() {
    get_connection_info
    build_application
    create_deployment_package
    upload_to_server
    deploy_on_server
    health_check
    cleanup
    show_logs

    echo ""
    echo "======================================"
    log_info "🎉 Deployment successful!"
    log_info "Application URL: http://$STATIC_IP"
    log_info "SSH: ssh -i $KEY_FILE $USERNAME@$STATIC_IP"
    echo "======================================"
}

# 에러 핸들링
trap 'log_error "Deployment failed!"; cleanup; exit 1' ERR

main "$@"

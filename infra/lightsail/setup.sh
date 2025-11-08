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
BUNDLE_ID=${BUNDLE_ID:-"nano_2_0"}
BLUEPRINT_ID=${BLUEPRINT_ID:-"nodejs_20"}

echo "======================================"
echo "  AWS Lightsail Setup  "
echo "======================================"
echo ""

# AWS CLI 확인
check_aws_cli() {
    log_step "Checking AWS CLI..."

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        log_info "Install from: https://aws.amazon.com/cli/"
        exit 1
    fi

    # AWS 자격 증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured"
        log_info "Run: aws configure"
        exit 1
    fi

    log_info "AWS CLI is configured ✓"
}

# Lightsail 인스턴스 생성
create_instance() {
    log_step "Creating Lightsail instance..."

    # 인스턴스가 이미 존재하는지 확인
    if aws lightsail get-instance --instance-name "$INSTANCE_NAME" --region "$REGION" &> /dev/null; then
        log_warn "Instance '$INSTANCE_NAME' already exists"
        return 0
    fi

    # User data 스크립트 준비
    USER_DATA=$(cat <<'EOF'
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Node.js는 이미 설치되어 있음 (blueprint: nodejs_20)

# Install Yarn
npm install -g yarn

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /opt/shopping-fraud-detector
chown -R bitnami:bitnami /opt/shopping-fraud-detector

# Create logs directory
mkdir -p /var/log/shopping-fraud-detector
chown -R bitnami:bitnami /var/log/shopping-fraud-detector

echo "✅ Lightsail instance initialized"
EOF
    )

    aws lightsail create-instances \
        --instance-names "$INSTANCE_NAME" \
        --region "$REGION" \
        --availability-zone "${REGION}a" \
        --blueprint-id "$BLUEPRINT_ID" \
        --bundle-id "$BUNDLE_ID" \
        --user-data "$USER_DATA" \
        --tags "key=Project,value=shopping-fraud-detector" "key=ManagedBy,value=script"

    log_info "Instance '$INSTANCE_NAME' created successfully ✓"
}

# Static IP 할당
allocate_static_ip() {
    log_step "Allocating static IP..."

    STATIC_IP_NAME="${INSTANCE_NAME}-static-ip"

    # Static IP가 이미 존재하는지 확인
    if aws lightsail get-static-ip --static-ip-name "$STATIC_IP_NAME" --region "$REGION" &> /dev/null; then
        log_warn "Static IP '$STATIC_IP_NAME' already exists"
    else
        aws lightsail allocate-static-ip \
            --static-ip-name "$STATIC_IP_NAME" \
            --region "$REGION"

        log_info "Static IP allocated ✓"
    fi

    # 인스턴스가 Running 상태가 될 때까지 대기
    log_info "Waiting for instance to be running..."
    for i in {1..30}; do
        STATE=$(aws lightsail get-instance-state --instance-name "$INSTANCE_NAME" --region "$REGION" --query 'state.name' --output text)
        if [ "$STATE" == "running" ]; then
            break
        fi
        echo -n "."
        sleep 10
    done
    echo ""

    # Static IP를 인스턴스에 연결
    aws lightsail attach-static-ip \
        --static-ip-name "$STATIC_IP_NAME" \
        --instance-name "$INSTANCE_NAME" \
        --region "$REGION"

    log_info "Static IP attached to instance ✓"

    # Static IP 출력
    STATIC_IP=$(aws lightsail get-static-ip --static-ip-name "$STATIC_IP_NAME" --region "$REGION" --query 'staticIp.ipAddress' --output text)
    log_info "Static IP: $STATIC_IP"
}

# 방화벽 규칙 설정
configure_firewall() {
    log_step "Configuring firewall rules..."

    # HTTP (80)
    aws lightsail put-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --region "$REGION" \
        --port-infos fromPort=80,toPort=80,protocol=tcp

    # HTTPS (443)
    aws lightsail put-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --region "$REGION" \
        --port-infos fromPort=443,toPort=443,protocol=tcp

    # SSH (22) - 이미 열려 있어야 함
    aws lightsail open-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --region "$REGION" \
        --port-info fromPort=22,toPort=22,protocol=tcp || true

    log_info "Firewall rules configured ✓"
}

# SSH 키 정보 출력
show_ssh_info() {
    log_step "Getting SSH connection info..."

    # SSH 키 다운로드
    KEY_FILE="$HOME/.ssh/${INSTANCE_NAME}-key.pem"

    if [ ! -f "$KEY_FILE" ]; then
        aws lightsail download-default-key-pair \
            --region "$REGION" \
            --output text \
            --query 'privateKeyBase64' | base64 --decode > "$KEY_FILE"

        chmod 400 "$KEY_FILE"
        log_info "SSH key saved to: $KEY_FILE"
    fi

    # 연결 정보
    STATIC_IP=$(aws lightsail get-static-ip --static-ip-name "${INSTANCE_NAME}-static-ip" --region "$REGION" --query 'staticIp.ipAddress' --output text)
    USERNAME=$(aws lightsail get-instance --instance-name "$INSTANCE_NAME" --region "$REGION" --query 'instance.username' --output text)

    echo ""
    echo "======================================"
    log_info "SSH Connection:"
    echo "  ssh -i $KEY_FILE $USERNAME@$STATIC_IP"
    echo ""
    log_info "Application URL:"
    echo "  http://$STATIC_IP"
    echo "======================================"
}

# 인스턴스 상태 확인
check_instance_status() {
    log_step "Checking instance status..."

    STATE=$(aws lightsail get-instance-state --instance-name "$INSTANCE_NAME" --region "$REGION" --query 'state.name' --output text)

    case "$STATE" in
        running)
            log_info "Instance is running ✓"
            ;;
        pending)
            log_warn "Instance is pending..."
            ;;
        stopped)
            log_warn "Instance is stopped"
            ;;
        *)
            log_error "Instance state: $STATE"
            ;;
    esac
}

# 메인 실행
main() {
    check_aws_cli
    create_instance
    allocate_static_ip
    configure_firewall
    check_instance_status
    show_ssh_info

    echo ""
    log_info "🎉 Lightsail setup completed!"
}

main "$@"

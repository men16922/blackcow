#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 설정
SERVER_URL=${SERVER_URL:-"http://localhost:3000"}
CLIENT_URL=${CLIENT_URL:-"http://localhost:3001"}
DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-"http://localhost:8000"}

# 전체 상태
ALL_CHECKS_PASSED=true

# 서버 헬스체크
check_server() {
    log_info "Checking server health at $SERVER_URL/health..."

    response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/health" 2>/dev/null)

    if [ "$response" -eq 200 ]; then
        log_success "Server is healthy (HTTP $response)"
        return 0
    else
        log_error "Server is unhealthy (HTTP $response)"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# 클라이언트 헬스체크
check_client() {
    log_info "Checking client at $CLIENT_URL..."

    response=$(curl -s -o /dev/null -w "%{http_code}" "$CLIENT_URL" 2>/dev/null)

    if [ "$response" -eq 200 ]; then
        log_success "Client is accessible (HTTP $response)"
        return 0
    else
        log_error "Client is not accessible (HTTP $response)"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# DynamoDB 연결 체크
check_dynamodb() {
    log_info "Checking DynamoDB connection at $DYNAMODB_ENDPOINT..."

    if aws dynamodb list-tables --endpoint-url "$DYNAMODB_ENDPOINT" > /dev/null 2>&1; then
        log_success "DynamoDB is connected"
        return 0
    else
        log_error "DynamoDB connection failed"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# API 엔드포인트 체크
check_api_endpoints() {
    log_info "Checking API endpoints..."

    # 헬스체크 엔드포인트
    health_response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/health" 2>/dev/null)

    if [ "$health_response" -eq 200 ]; then
        log_success "API endpoints are responding"
        return 0
    else
        log_error "API endpoints are not responding"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# 포트 사용 체크
check_ports() {
    log_info "Checking required ports..."

    # 포트 3000 체크 (서버)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Port 3000 (Server) is in use"
    else
        log_error "Port 3000 (Server) is not in use"
        ALL_CHECKS_PASSED=false
    fi

    # 포트 3001 체크 (클라이언트)
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Port 3001 (Client) is in use"
    else
        log_error "Port 3001 (Client) is not in use"
        ALL_CHECKS_PASSED=false
    fi

    # 포트 8000 체크 (DynamoDB)
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Port 8000 (DynamoDB) is in use"
    else
        log_error "Port 8000 (DynamoDB) is not in use"
        ALL_CHECKS_PASSED=false
    fi
}

# 디스크 공간 체크
check_disk_space() {
    log_info "Checking disk space..."

    # 사용 가능한 디스크 공간 (%)
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "Disk space is sufficient (${DISK_USAGE}% used)"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log_info "Disk space is running low (${DISK_USAGE}% used)"
    else
        log_error "Disk space is critically low (${DISK_USAGE}% used)"
        ALL_CHECKS_PASSED=false
    fi
}

# 메모리 사용량 체크
check_memory() {
    log_info "Checking memory usage..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        MEMORY_USAGE=$(top -l 1 | grep PhysMem | awk '{print $2}' | sed 's/M//')
        log_success "Memory check completed"
    else
        # Linux
        MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
        if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
            log_success "Memory usage is normal (${MEMORY_USAGE}%)"
        else
            log_error "Memory usage is high (${MEMORY_USAGE}%)"
            ALL_CHECKS_PASSED=false
        fi
    fi
}

# 전체 헬스체크
main() {
    echo "======================================"
    echo "  Health Check - Shopping Fraud Detector  "
    echo "======================================"
    echo ""

    check_server
    check_client
    check_dynamodb
    check_api_endpoints
    check_ports
    check_disk_space
    check_memory

    echo ""
    echo "======================================"

    if [ "$ALL_CHECKS_PASSED" = true ]; then
        log_success "All systems operational"
        exit 0
    else
        log_error "Some checks failed"
        exit 1
    fi
}

main "$@"

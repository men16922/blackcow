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
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${TIMESTAMP}"
DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-"http://localhost:8000"}

# 백업 디렉토리 생성
create_backup_dir() {
    log_step "Creating backup directory..."

    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi

    CURRENT_BACKUP_DIR="$BACKUP_DIR/$BACKUP_NAME"
    mkdir -p "$CURRENT_BACKUP_DIR"

    log_info "Backup will be saved to: $CURRENT_BACKUP_DIR"
}

# DynamoDB 테이블 백업
backup_dynamodb_table() {
    local table_name=$1
    log_info "Backing up DynamoDB table: $table_name..."

    local output_file="$CURRENT_BACKUP_DIR/${table_name}.json"

    # 테이블 스캔 및 백업
    aws dynamodb scan \
        --table-name "$table_name" \
        --endpoint-url "$DYNAMODB_ENDPOINT" \
        --output json > "$output_file"

    if [ $? -eq 0 ]; then
        log_info "✓ Table '$table_name' backed up successfully"
        return 0
    else
        log_error "✗ Failed to backup table '$table_name'"
        return 1
    fi
}

# 모든 DynamoDB 테이블 백업
backup_all_dynamodb_tables() {
    log_step "Backing up all DynamoDB tables..."

    # 테이블 목록 가져오기
    TABLES=$(aws dynamodb list-tables \
        --endpoint-url "$DYNAMODB_ENDPOINT" \
        --output text \
        --query 'TableNames')

    if [ -z "$TABLES" ]; then
        log_warn "No tables found to backup"
        return 0
    fi

    for table in $TABLES; do
        backup_dynamodb_table "$table"
    done

    log_info "All DynamoDB tables backed up ✓"
}

# 환경 변수 백업
backup_env_variables() {
    log_step "Backing up environment configuration..."

    local env_backup_file="$CURRENT_BACKUP_DIR/environment.txt"

    {
        echo "# Environment Backup - $TIMESTAMP"
        echo "# DO NOT COMMIT THIS FILE TO VERSION CONTROL"
        echo ""
        echo "NODE_ENV=$NODE_ENV"
        echo "# Other non-sensitive environment info"
    } > "$env_backup_file"

    log_info "Environment configuration backed up ✓"
}

# 로그 파일 백업
backup_logs() {
    log_step "Backing up log files..."

    local logs_dir="./logs"
    local logs_backup_dir="$CURRENT_BACKUP_DIR/logs"

    if [ -d "$logs_dir" ]; then
        mkdir -p "$logs_backup_dir"
        cp -r "$logs_dir"/* "$logs_backup_dir/" 2>/dev/null || true
        log_info "Log files backed up ✓"
    else
        log_warn "No log directory found, skipping..."
    fi
}

# 백업 압축
compress_backup() {
    log_step "Compressing backup..."

    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

    if [ $? -eq 0 ]; then
        # 압축 성공 시 원본 디렉토리 삭제
        rm -rf "$BACKUP_NAME"
        log_info "Backup compressed: ${BACKUP_NAME}.tar.gz ✓"
    else
        log_error "Failed to compress backup"
        return 1
    fi

    cd - > /dev/null
}

# 오래된 백업 정리
cleanup_old_backups() {
    log_step "Cleaning up old backups..."

    # 7일 이상 된 백업 파일 삭제
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -delete

    local remaining_backups=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f | wc -l)
    log_info "Old backups cleaned up. Remaining backups: $remaining_backups ✓"
}

# 백업 검증
verify_backup() {
    log_step "Verifying backup..."

    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

    if [ -f "$backup_file" ]; then
        local file_size=$(du -h "$backup_file" | awk '{print $1}')
        log_info "Backup file size: $file_size"
        log_info "Backup verified ✓"
        return 0
    else
        log_error "Backup file not found!"
        return 1
    fi
}

# 백업 복원 가이드 생성
create_restore_guide() {
    local guide_file="$BACKUP_DIR/RESTORE_GUIDE.md"

    cat > "$guide_file" << 'EOF'
# Backup Restore Guide

## 백업 복원 방법

### 1. 백업 파일 압축 해제

```bash
cd backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
```

### 2. DynamoDB 테이블 복원

```bash
# Products 테이블 복원
aws dynamodb batch-write-item \
    --request-items file://backup_YYYYMMDD_HHMMSS/Products.json \
    --endpoint-url http://localhost:8000

# AnalysisHistory 테이블 복원
aws dynamodb batch-write-item \
    --request-items file://backup_YYYYMMDD_HHMMSS/AnalysisHistory.json \
    --endpoint-url http://localhost:8000
```

### 3. 환경 변수 복원

```bash
# environment.txt 파일을 참고하여 .env 파일 업데이트
```

### 주의사항

- 복원하기 전에 현재 데이터를 백업하세요
- 프로덕션 환경에서는 신중하게 진행하세요
- 민감한 정보(API 키 등)는 별도로 관리하세요
EOF

    log_info "Restore guide created: $guide_file"
}

# 메인 실행
main() {
    echo "======================================"
    echo "  Backup - Shopping Fraud Detector  "
    echo "======================================"
    echo ""

    create_backup_dir
    backup_all_dynamodb_tables
    backup_env_variables
    backup_logs
    compress_backup
    verify_backup
    cleanup_old_backups
    create_restore_guide

    echo ""
    log_info "🎉 Backup completed successfully!"
    log_info "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
}

main "$@"

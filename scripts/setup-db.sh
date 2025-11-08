#!/bin/bash
set -e

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# DynamoDB 엔드포인트 설정
DYNAMODB_ENDPOINT=${DYNAMODB_ENDPOINT:-"http://localhost:8000"}

log_info "DynamoDB Endpoint: $DYNAMODB_ENDPOINT"

# DynamoDB 연결 확인
check_dynamodb_connection() {
    log_info "Checking DynamoDB connection..."

    if aws dynamodb list-tables --endpoint-url "$DYNAMODB_ENDPOINT" > /dev/null 2>&1; then
        log_info "DynamoDB connection successful ✓"
    else
        log_error "Cannot connect to DynamoDB at $DYNAMODB_ENDPOINT"
        log_error "Please ensure DynamoDB is running"
        exit 1
    fi
}

# Products 테이블 생성
create_products_table() {
    log_info "Creating Products table..."

    TABLE_NAME="Products"

    # 테이블이 이미 존재하는지 확인
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --endpoint-url "$DYNAMODB_ENDPOINT" > /dev/null 2>&1; then
        log_warn "Table '$TABLE_NAME' already exists, skipping..."
        return 0
    fi

    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=url,AttributeType=S \
            AttributeName=createdAt,AttributeType=N \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            '[
                {
                    "IndexName": "UrlIndex",
                    "KeySchema": [{"AttributeName":"url","KeyType":"HASH"}],
                    "Projection": {"ProjectionType":"ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                },
                {
                    "IndexName": "CreatedAtIndex",
                    "KeySchema": [{"AttributeName":"createdAt","KeyType":"HASH"}],
                    "Projection": {"ProjectionType":"ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                }
            ]' \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --endpoint-url "$DYNAMODB_ENDPOINT"

    log_info "Table '$TABLE_NAME' created successfully ✓"
}

# AnalysisHistory 테이블 생성
create_analysis_history_table() {
    log_info "Creating AnalysisHistory table..."

    TABLE_NAME="AnalysisHistory"

    # 테이블이 이미 존재하는지 확인
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --endpoint-url "$DYNAMODB_ENDPOINT" > /dev/null 2>&1; then
        log_warn "Table '$TABLE_NAME' already exists, skipping..."
        return 0
    fi

    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=productId,AttributeType=S \
            AttributeName=timestamp,AttributeType=N \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            '[
                {
                    "IndexName": "ProductIdIndex",
                    "KeySchema": [
                        {"AttributeName":"productId","KeyType":"HASH"},
                        {"AttributeName":"timestamp","KeyType":"RANGE"}
                    ],
                    "Projection": {"ProjectionType":"ALL"},
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                }
            ]' \
        --provisioned-throughput \
            ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --endpoint-url "$DYNAMODB_ENDPOINT"

    log_info "Table '$TABLE_NAME' created successfully ✓"
}

# 테이블 목록 출력
list_tables() {
    log_info "Listing all tables..."

    TABLES=$(aws dynamodb list-tables --endpoint-url "$DYNAMODB_ENDPOINT" --output text --query 'TableNames')

    echo ""
    echo "📊 Available Tables:"
    for table in $TABLES; do
        echo "  - $table"
    done
    echo ""
}

# 메인 실행
main() {
    echo "======================================"
    echo "  DynamoDB Setup for Shopping Fraud Detector  "
    echo "======================================"
    echo ""

    check_dynamodb_connection
    create_products_table
    create_analysis_history_table
    list_tables

    log_info "🎉 DynamoDB setup completed successfully!"
}

main "$@"

# Terraform Infrastructure

AWS 인프라를 코드로 관리하기 위한 Terraform 설정 파일들입니다.

## 프로비저닝되는 리소스

- AWS Lightsail 인스턴스 (Node.js 20)
- Lightsail Static IP
- DynamoDB 테이블 (Products, AnalysisHistory)
- CloudWatch Log Group
- IAM Role 및 Policy
- CloudWatch 알람 (High CPU)

## 사전 요구사항

1. **Terraform 설치** (v1.0+)

   ```bash
   # macOS
   brew install terraform

   # Windows
   choco install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI 설치 및 구성**

   ```bash
   aws configure
   ```

3. **Claude API 키** 발급
   - https://console.anthropic.com/에서 API 키 발급

## 사용 방법

### 1. 변수 파일 설정

```bash
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` 파일을 편집하여 실제 값 입력:

```hcl
aws_region = "ap-northeast-2"
environment = "production"
claude_api_key = "sk-ant-api03-your-actual-key-here"
```

### 2. Terraform 초기화

```bash
terraform init
```

### 3. 인프라 계획 확인

```bash
terraform plan
```

### 4. 인프라 프로비저닝

```bash
terraform apply
```

확인 프롬프트에서 `yes` 입력

### 5. 출력 확인

```bash
terraform output
```

다음과 같은 정보가 출력됩니다:

- Lightsail 인스턴스 Public IP
- DynamoDB 테이블 이름
- SSH 접속 명령어

## 주요 명령어

### 인프라 상태 확인

```bash
terraform show
```

### 특정 리소스만 적용

```bash
terraform apply -target=aws_lightsail_instance.app_server
```

### 인프라 삭제

```bash
terraform destroy
```

### 변수 검증

```bash
terraform validate
```

### 포맷팅

```bash
terraform fmt
```

## 환경별 배포

### Development

```bash
terraform workspace new dev
terraform workspace select dev
terraform apply -var="environment=dev" -var="lightsail_bundle_id=nano_2_0"
```

### Production

```bash
terraform workspace new production
terraform workspace select production
terraform apply -var="environment=production" -var="lightsail_bundle_id=small_2_0"
```

## 비용 예상

### Lightsail 인스턴스

- nano_2_0: $3.50/월
- micro_2_0: $5.00/월
- small_2_0: $10.00/월

### DynamoDB

- PAY_PER_REQUEST 모드: 읽기/쓰기 요청당 과금
- 예상: $5-10/월 (소규모 트래픽)

### 총 예상 비용

- Development: ~$10-15/월
- Production: ~$20-30/월

## 보안

### 민감 정보 관리

1. **terraform.tfvars를 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있음

2. **환경 변수 사용 (권장)**

   ```bash
   export TF_VAR_claude_api_key="sk-ant-api03-..."
   terraform apply
   ```

3. **AWS Secrets Manager 사용 (프로덕션 권장)**
   ```hcl
   data "aws_secretsmanager_secret_version" "claude_api_key" {
     secret_id = "claude-api-key"
   }
   ```

## 트러블슈팅

### 1. Terraform 초기화 실패

```bash
# .terraform 디렉토리 삭제 후 재시도
rm -rf .terraform
terraform init
```

### 2. 리소스 이름 충돌

```bash
# 기존 리소스를 state로 가져오기
terraform import aws_lightsail_instance.app_server shopping-fraud-detector-production
```

### 3. State 파일 손상

```bash
# State 백업
cp terraform.tfstate terraform.tfstate.backup

# State 복구
terraform state pull > terraform.tfstate
```

## 모범 사례

1. **Remote State 사용**
   - S3 백엔드로 state 파일 관리
   - DynamoDB로 state locking

2. **모듈화**
   - 재사용 가능한 모듈로 구성

3. **워크스페이스 활용**
   - 환경별 워크스페이스 분리

4. **태그 전략**
   - 모든 리소스에 일관된 태그 적용

## 참고 자료

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lightsail 문서](https://docs.aws.amazon.com/lightsail/)
- [DynamoDB 모범 사례](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

---
name: query-dynamodb
description: DynamoDB 쿼리 작성을 도와줍니다
---

DynamoDB 쿼리 및 스캔 작성을 도와줍니다.

## 테이블 구조

### Products 테이블

- Partition Key: `id` (String)
- Attributes: `url`, `name`, `price`, `seller`, `brs`, `analyzedAt`

### AnalysisResults 테이블

- Partition Key: `productId` (String)
- Sort Key: `timestamp` (Number)

## 주요 쿼리 패턴

### 1. 단일 아이템 조회 (GetItem)

```typescript
import { dynamodb } from '../db/dynamodb';

const result = await dynamodb
  .get({
    TableName: 'Products',
    Key: { id: 'product-123' },
  })
  .promise();
```

### 2. 조건부 쿼리 (Query)

```typescript
const results = await dynamodb
  .query({
    TableName: 'AnalysisResults',
    KeyConditionExpression: 'productId = :pid',
    ExpressionAttributeValues: {
      ':pid': 'product-123',
    },
    ScanIndexForward: false, // 최신순 정렬
    Limit: 10,
  })
  .promise();
```

### 3. 전체 스캔 (Scan) - 주의: 비용 발생

```typescript
const results = await dynamodb
  .scan({
    TableName: 'Products',
    FilterExpression: 'brs > :minBrs',
    ExpressionAttributeValues: {
      ':minBrs': 70,
    },
  })
  .promise();
```

### 4. 아이템 생성 (PutItem)

```typescript
await dynamodb
  .put({
    TableName: 'Products',
    Item: {
      id: 'product-123',
      url: 'https://...',
      name: '상품명',
      price: 50000,
      analyzedAt: Date.now(),
    },
  })
  .promise();
```

### 5. 아이템 업데이트 (UpdateItem)

```typescript
await dynamodb
  .update({
    TableName: 'Products',
    Key: { id: 'product-123' },
    UpdateExpression: 'SET brs = :brs, analyzedAt = :time',
    ExpressionAttributeValues: {
      ':brs': 65,
      ':time': Date.now(),
    },
  })
  .promise();
```

## 프로젝트 DB 클라이언트 위치

- `apps/server/src/db/dynamodb.ts`

## 체크리스트

- [ ] Partition Key 사용
- [ ] Scan 대신 Query 사용 (성능)
- [ ] 페이지네이션 구현 (Limit + LastEvaluatedKey)
- [ ] 에러 처리 (try-catch)
- [ ] 타입 안정성 확인

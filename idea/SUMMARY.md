# 쇼핑 흑우 감별사 - 확장 기능 아이디어 요약

## 개요

이 문서는 쇼핑 흑우 감별사의 MVP 이후 구현 가능한 9가지 확장 기능 아이디어를 정리합니다. 각 기능은 우선순위, 구현 난이도, 사용자 가치를 기준으로 분류되었습니다.

---

## 우선순위별 분류

### 🔥 Phase 2: 핵심 기능 강화 (MVP 직후 구현 권장)

#### 1. 리뷰 감정 지도 ⭐⭐⭐

**개념**
- 리뷰를 긍정/중립/부정으로 AI 분류
- Pie Chart 또는 Word Cloud로 시각화
- 부정 키워드 상위 5개 표시

**구현 방법**
```javascript
// AI로 리뷰 감정 분석
const sentiments = await analyzeSentiments(reviews);

// Chart.js로 Pie Chart 생성
const data = {
  labels: ['긍정', '중립', '부정'],
  datasets: [{
    data: [positive, neutral, negative],
    backgroundColor: ['#4ade80', '#fbbf24', '#ef4444']
  }]
};

// Word Cloud (선택적)
// react-wordcloud 또는 D3.js 사용
```

**기술 스택**
- AWS Bedrock Claude Sonnet 4.0 (감정 분석)
- Chart.js (Pie Chart)
- react-wordcloud 또는 D3.js (Word Cloud)

**사용자 가치**
- 복잡한 리뷰를 한눈에 파악
- AI 분석 결과의 시각적 신뢰도 향상
- 시연 효과 극대화

**구현 난이도**: 중간

---

#### 2. AI 추천 코멘트 ⭐⭐⭐

**개념**
- AI가 분석 결과를 자연어로 요약
- 톤(neutral/alert/safe)에 따라 UI 색상 변경

**예시**
```
[Alert 톤 - 빨간색]
"이 상품은 최근 3일 내 리뷰가 급증했으며, 
마케팅성 키워드가 다수 포함되어 있습니다. 
구매 전 신중한 검토가 필요합니다."

[Safe 톤 - 초록색]
"이 상품은 가격이 시장 평균 범위 내에 있으며, 
판매자 신뢰도도 양호합니다. 
비교적 안전한 구매로 판단됩니다."
```

**구현 방법**
```javascript
// AI 프롬프트
const prompt = `
다음 분석 결과를 한국어로 2-3문장으로 요약하세요:
- BRS: ${brs}
- 위험 요소: ${reasonCodes}
- 판매자 신뢰도: ${sellerScore}

톤: ${brs > 60 ? 'alert' : brs > 30 ? 'neutral' : 'safe'}
`;

const comment = await bedrock.invoke(prompt);
```

**UI 구현**
```jsx
<div className={`p-4 rounded-lg ${
  tone === 'alert' ? 'bg-red-50 border-red-200' :
  tone === 'neutral' ? 'bg-yellow-50 border-yellow-200' :
  'bg-green-50 border-green-200'
}`}>
  <p className="text-sm">{aiComment}</p>
</div>
```

**사용자 가치**
- 점수 이상의 이해 가능한 설명
- AI의 개입을 체감
- 비전문가도 쉽게 이해

**구현 난이도**: 낮음

---

#### 3. 위험 키워드 감지기 ⭐⭐

**개념**
- 상품 설명/리뷰에서 사기성 단어 자동 탐지
- 하이라이트로 강조 표시
- 키워드 가중치 기반 위험도 계산

**키워드 사전 예시**
```javascript
const fraudKeywords = {
  "정품 보장": 2,
  "공식몰": 2,
  "최저가": 1,
  "가성비": 1,
  "원가 이하": 3,
  "100% 환불": 2,
  "한정 수량": 1,
  "오늘만": 2
};
```

**구현 방법**
```javascript
// 서버: 키워드 탐지
function detectKeywords(text) {
  const detected = [];
  let riskScore = 0;
  
  for (const [keyword, weight] of Object.entries(fraudKeywords)) {
    if (text.includes(keyword)) {
      detected.push({ keyword, weight });
      riskScore += weight;
    }
  }
  
  return { detected, riskScore };
}

// 클라이언트: 하이라이트
function highlightKeywords(text, keywords) {
  let highlighted = text;
  keywords.forEach(kw => {
    highlighted = highlighted.replace(
      new RegExp(kw, 'g'),
      `<mark class="bg-red-200">${kw}</mark>`
    );
  });
  return highlighted;
}
```

**사용자 가치**
- 사기성 표현을 즉시 식별
- 구현 단순하면서 효과 큼
- AI의 설명력 시각화

**구현 난이도**: 낮음

---

#### 4. 리스크 타임라인 ⭐⭐

**개념**
- 동일 상품의 과거 분석 결과를 시간순 저장
- Line Chart로 BRS, 가격, 판매자 신뢰도 변화 추적

**데이터 구조**
```javascript
// MongoDB
{
  productId: "coupang_12345",
  history: [
    {
      analyzedAt: "2024-01-01",
      brs: 45,
      price: 98000,
      sellerTrust: 65
    },
    {
      analyzedAt: "2024-01-15",
      brs: 62,
      price: 89000,
      sellerTrust: 58
    }
  ]
}
```

**구현 방법**
```javascript
// Chart.js Line Chart
const data = {
  labels: history.map(h => h.analyzedAt),
  datasets: [
    {
      label: 'BRS',
      data: history.map(h => h.brs),
      borderColor: 'rgb(239, 68, 68)',
      tension: 0.1
    },
    {
      label: '가격',
      data: history.map(h => h.price),
      borderColor: 'rgb(59, 130, 246)',
      yAxisID: 'y1'
    }
  ]
};
```

**사용자 가치**
- 위험도 추세 확인
- 반복 사용 유도 (Retention)
- 신뢰도 상승

**구현 난이도**: 중간

---

### 🚀 Phase 3: 고급 기능

#### 5. 상품 비교 카드 ⭐

**개념**
- 두 개의 상품 URL을 동시 입력
- 가격, 리뷰, BRS, 판매자 정보를 비교 테이블로 표시

**구현 방법**
```javascript
// 병렬 분석
const [result1, result2] = await Promise.all([
  analyzeProduct(url1),
  analyzeProduct(url2)
]);

// 비교 테이블
const comparison = {
  brs: { product1: result1.brs, product2: result2.brs },
  price: { product1: result1.price, product2: result2.price },
  sellerTrust: { product1: result1.seller, product2: result2.seller }
};
```

**UI 예시**
```
┌─────────────┬──────────┬──────────┐
│ 항목        │ 상품 A   │ 상품 B   │
├─────────────┼──────────┼──────────┤
│ BRS         │ 45 🟡    │ 72 🔴    │
│ 가격        │ 98,000원 │ 89,000원 │
│ 판매자 신뢰 │ 65점     │ 42점     │
│ 추천        │ ✅       │ ❌       │
└─────────────┴──────────┴──────────┘
```

**사용자 가치**
- 구매 결정 지원
- 시각적으로 강력한 데모

**구현 난이도**: 중간

---

#### 6. 사기 리포트 생성기 ⭐

**개념**
- 분석 결과를 PDF로 자동 생성
- 로고, 차트, 날짜 포함

**구현 방법**
```javascript
// jsPDF 사용
import jsPDF from 'jspdf';

function generateReport(analysisResult) {
  const doc = new jsPDF();
  
  // 헤더
  doc.setFontSize(20);
  doc.text('쇼핑 흑우 감별사 분석 리포트', 20, 20);
  
  // BRS
  doc.setFontSize(12);
  doc.text(`위험도 점수: ${analysisResult.brs}`, 20, 40);
  
  // 차트 이미지 삽입
  doc.addImage(chartImage, 'PNG', 20, 50, 170, 100);
  
  // 저장
  doc.save(`fraud_report_${Date.now()}.pdf`);
}
```

**사용자 가치**
- 결과 공유 및 저장
- 기업 제휴 가능성

**구현 난이도**: 낮음

---

#### 7. 사용자 참여형 사기 DB ⭐

**개념**
- 사용자가 사기 의심 상품 신고
- 다른 사용자가 투표로 신뢰도 평가

**데이터 구조**
```javascript
// MongoDB fraud_reports
{
  url: "https://...",
  reason: "가격이 너무 저렴함",
  reportedBy: "user123",
  votes: {
    good: 15,
    bad: 3
  },
  createdAt: Date
}
```

**구현 방법**
```javascript
// 신고 API
app.post('/api/report', async (req, res) => {
  const { url, reason } = req.body;
  await db.fraudReports.insert({
    url,
    reason,
    votes: { good: 0, bad: 0 },
    createdAt: new Date()
  });
});

// 투표 API
app.post('/api/vote/:reportId', async (req, res) => {
  const { vote } = req.body; // 'good' or 'bad'
  await db.fraudReports.update(
    { _id: reportId },
    { $inc: { [`votes.${vote}`]: 1 } }
  );
});
```

**사용자 가치**
- 커뮤니티 기반 데이터 축적
- 사용자 참여 유도
- AI 학습 데이터 확보

**구현 난이도**: 중간

---

### ⚠️ Phase 4: 구현 어려움 (보류)

#### 8. 중고 대안 추천 ❌

**개념**
- 새 상품이 위험하면 중고 플랫폼(번개장터, 당근) 검색
- 가격이 15% 이상 저렴한 중고 상품 추천

**보류 사유**
- 상품명 정규화 어려움
  - "아이폰 15 프로 256GB" vs "아이폰15프로 256기가"
  - 브랜드명, 모델명, 옵션 추출 복잡
- 중고 플랫폼 크롤링 제한
- 상품 매칭 정확도 낮음

**구현 난이도**: 매우 높음

---

#### 9. 판매자 평판 카드 ❌

**개념**
- 판매자별 누적 분석 결과 요약
- 신뢰 점수, 부정 리뷰 비율, 과거 탐지 이력

**보류 사유**
- 여러 쇼핑몰의 판매자 프로파일링 어려움
  - 쿠팡, 네이버, 11번가 각각 다른 구조
  - 판매자 식별자 통일 불가
- 개인정보 보호 이슈
- 데이터 수집 한계

**구현 난이도**: 매우 높음

---

## 구현 로드맵

### MVP (4주)
- 기본 크롤링
- 가격/판매자/리뷰 분석
- BRS 계산
- 대안 추천
- React UI

### Phase 2 (2주)
1. AI 추천 코멘트 (1일)
2. 위험 키워드 감지기 (2일)
3. 리뷰 감정 지도 (3일)
4. 리스크 타임라인 (4일)

### Phase 3 (2주)
5. 상품 비교 카드 (3일)
6. 사기 리포트 생성기 (2일)
7. 사용자 참여형 사기 DB (5일)

### Phase 4 (보류)
8. 중고 대안 추천
9. 판매자 평판 카드

---

## 기술 스택 요약

### 필수
- AWS Bedrock Claude Sonnet 4.0 (AI 분석)
- Chart.js (데이터 시각화)
- MongoDB (데이터 저장)

### 선택적
- react-wordcloud 또는 D3.js (Word Cloud)
- jsPDF (PDF 생성)
- Recharts (고급 차트)

---

## 비용 예상

### Phase 2 추가 비용
- AI 코멘트 생성: +$1-2/월
- 총: $6-8/월

### Phase 3 추가 비용
- PDF 생성: $0 (클라이언트 측)
- 사용자 DB: +$0-1/월 (MongoDB 용량)
- 총: $6-9/월

---

## 우선순위 결정 기준

1. **사용자 가치**: 사용자에게 얼마나 유용한가?
2. **구현 난이도**: 개발 시간과 복잡도
3. **시연 효과**: 데모/발표 시 임팩트
4. **확장성**: 향후 기능 확장 기반

**Phase 2 우선 이유**:
- 구현 난이도 낮음
- 사용자 가치 높음
- AI 활용 극대화
- 시연 효과 큼

**Phase 4 보류 이유**:
- 구현 난이도 매우 높음
- 데이터 수집 한계
- MVP 완성도에 영향 없음

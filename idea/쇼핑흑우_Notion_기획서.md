# 🐄 쇼핑 흑우(Black Cow) 감별사

> 💬 **AI 기반 짝퉁·사기 위험도 분석 서비스**  
> “이 링크, 믿어도 될까?”

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 쇼핑 흑우 감별사 |
| **개발기간** | 약 4주 (MVP) |
| **기술스택** | Java(Spring Boot), MySQL, React, Selenium, GPT API, OpenCV/Rekognition |
| **타깃 사용자** | 온라인 쇼핑 이용자 (비IT 포함), 중고·해외직구 구매자 |
| **차별화 포인트** | AI 기반 위험도 분석 + Reason Code + 대안 추천 |

---

## 🧭 주요 기능

- 🧮 **가격 이상치 탐지** — Median + MAD 기반
- 🧍 **판매자 신뢰도 평가** — 계정 연령, 반품 정책, 출발지 등
- 🖼️ **콘텐츠 진위 분석** — 이미지/OCR/스펙 검증
- 📝 **리뷰 패턴 분석** — 조작 리뷰, 폭증 패턴 감지
- 🐄 **흑우 위험도 점수화** — BRS 산출 및 근거 제공
- 🪄 **대안 링크 추천** — 안전한 구매처 제안

---

## 🧠 분석 로직

| 항목 | 설명 |
|------|-------|
| 가격 분석 | Median + MAD 이상치 탐지 |
| 판매자 신뢰도 | 계정 연령, 반품 정책 등 가중치 합산 |
| 콘텐츠 분석 | pHash/CLIP 이미지 유사도 + OCR |
| 리뷰 패턴 | 조작 리뷰, 반복 문장, 폭증 탐지 |
| 위험도 점수화 | 가중치 기반 BRS 산출 (0~100점) |

---

## 🛍 데이터 확보 전략

- 📊 **가격 데이터**: 쿠팡 / 네이버 / 11번가 크롤링
- 🧍 **판매자 정보**: 계정정보, 반품정책, 배송출발지 추출
- 💬 **리뷰 데이터**: 최근 30~50개 리뷰 분석
- 🖼️ **이미지 데이터**: 판매자 썸네일 + 공식 이미지 비교
- 🏷️ **브랜드 DB**: 공식몰 및 리셀러 리스트 수동 등록 → 추후 자동화

---

## 🧱 아키텍처

```
[Front-End] React / Vue
    ↓ REST API
[Spring Boot Backend]
 ├─ Crawler Service
 ├─ Price Service
 ├─ Seller Service
 ├─ Content Veracity Service
 ├─ Review Service
 ├─ Risk Engine (BRS)
 └─ Recommendation Service
    ↓
[MySQL] [Redis] [S3]
[GPT API + Rekognition + OCR]
```

---

## 🧰 기술 스택

- **Backend:** Java 17, Spring Boot 3.x, WebFlux  
- **Frontend:** React or Vue, Tailwind, Axios  
- **Crawling:** Selenium, Playwright, Jsoup  
- **AI:** GPT API, OpenCV, Rekognition, Tesseract OCR  
- **DB:** MySQL, Redis(Cache), S3(이미지)  
- **CI/CD:** GitHub Actions, Docker, AWS  
- **Logging:** ELK Stack, Sentry

---

## 🧪 개발 일정 (4주)

| 주차 | 작업 내용 |
|-------|------------|
| 1주차 | 기본 크롤러, 가격 분석 엔진 |
| 2주차 | 판매자 신뢰도 분석, 리뷰 수집 |
| 3주차 | 이미지 진위 분석, Risk Engine 개발 |
| 4주차 | 대안 추천, UI, 배포 |

---

## 🧭 UX 설계 방향

- 🖱️ **링크 한 개 입력** → 결과 자동 분석  
- 📊 카드 형태의 분석 결과 (가격 / 판매자 / 리뷰 / 이미지 / 대안)  
- 🧠 Reason Code 기반 설명으로 비IT 사용자도 쉽게 이해 가능

---

## ⚖️ 윤리/법적 가이드

- 📜 국가/지역 편견 없이 데이터 기반 판단
- 🤖 robots.txt 준수, 로그인 영역 크롤링 금지
- 🔐 개인정보 수집 없음
- ⚠️ 결과는 자동화 분석이며 구매 판단의 보조 수단임을 명시

---

## 🚀 향후 확장 계획

- 🧾 사기 판매자 DB 구축 및 랭킹 시스템
- 🏷️ 브랜드 API 제휴 (공식 인증)
- 📈 가격 트렌드 시계열 분석
- 🧑‍🤝‍🧑 사용자 신고/피드백 루프
- 📱 모바일 앱 버전 개발

---

## 👨‍💻 팀 정보

| 역할 | 이름 | 비고 |
|------|------|------|
| 기획/개발 | 본인 | 풀스택 |
| AI/분석 | 본인 | 사이드 프로젝트 |

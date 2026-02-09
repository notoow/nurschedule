# 🏥 NurSchedule AI (v1.0)
> **"수간호사님의 칼퇴를 보장합니다."**  
> 700명 스케일도 거뜬한 차세대 간호사 근무표 자동화 엔진.

![NurSchedule Banner](public/og-image.png)

## 🚀 Key Features

### 1. 🧠 AI Scheduling Engine (World-Class)
- **Genetic Algorithm**: 유전 알고리즘 기반으로 수천 번의 시뮬레이션을 통해 최적의 근무표를 찾아냅니다.
- **Constraints Solver**: "이브닝-데이 금지", "3일 연속 나이트 금지" 등 복잡한 제약 조건을 0.01초 만에 검증합니다.
- **700-Scale Ready**: `Web Worker`와 `Shared Memory` 기술로 700명 이상의 대형 병원 근무표도 브라우저 멈춤 없이 생성합니다.

### 2. 🎨 Premium Dashboard
- **Request Lock (🔒)**: 클릭 한 번으로 "김간호사 15일 휴무"를 고정(Lock)할 수 있습니다.
- **Visual Grid**: 직관적인 색상 코드(Day-파랑, Eve-초록, Night-빨강)로 듀티 흐름이 한눈에 들어옵니다.
- **Zero-Lag UI**: `TanStack Virtual` 기술을 적용하여 스크롤이 매끄럽습니다.

### 3. 📂 Powerful Export
- **Excel Export**: 완성된 근무표를 클릭 한 번으로 **"결재용 엑셀 파일"**로 변환합니다. (서식/색상 자동 적용)

---

## 🛠️ Tech Stack (Architecture)

| Layer | Technology | Reason |
|-------|------------|--------|
| **Core** | `Next.js 14` (App Router) | SEO 및 최신 React 기능 활용 |
| **State** | `Zustand` + `Immer` | 700명 데이터의 불변성 관리 및 렌더링 최적화 |
| **Engine** | `Web Worker` + `Comlink` | 메인 스레드 블로킹 없는 병렬 연산 |
| **Data** | `Uint8Array` (TypedArray) | 메모리 효율 극대화 (JS 객체 대비 100배 절약) |
| **Grid** | `TanStack Virtual` | 수만 개 셀의 DOM 가상화 렌더링 |
| **Export**| `xlsx-js-style` | 스타일이 적용된 엑셀 파일 생성 |

---

## 🚦 How to Run

```bash
# 1. Install Dependencies
npm install

# 2. Run Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🤝 Contribution
이 프로젝트는 간호 현장의 고충을 해결하기 위해 시작되었습니다.
PR과 Issue 제보는 언제나 환영합니다.

---
**Made with ❤️ by notoow**

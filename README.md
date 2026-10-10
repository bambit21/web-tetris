# 🕹️ Web Tetris Game (Complete Edition)

현대적인 웹 브라우저 기반의 아케이드 스타일 테트리스 게임입니다.  
HTML5 Canvas와 순수 바닐라 자바스크립트(ES6+), CSS3로 제작되었으며, 외부 라이브러리나 외부 오디오 파일 의존성 없이 단독으로 실행됩니다.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ 주요 기능 및 특징

### 1. 정통 테트리스 공식 룰 및 메커니즘
* **10×20 매트릭스 그리드**: 표준 규격 보드 및 섬세한 가이드라인 그리드
* **입체 3D 베벨 블록 렌더링**: 상단/좌측 하이라이트와 하단/우측 음영이 들어간 레트로 아케이드 비주얼
* **7-Bag 무작위 생성기**: 특정 블록 가뭄을 방지하는 7개 묶음 셔플 랜덤 시스템
* **SRS (Super Rotation System) 기반 Wall Kick**: 벽이나 바닥에 닿았을 때 회전이 막히지 않고 튕겨서 회전되는 월킥 지원
* **고스트 피스 (Ghost Piece)**: 블록이 수직 낙하할 최종 착지 위치를 네온 아웃라인으로 실시간 안내

### 2. 표준 편의 시스템 및 스코어 공식
* **홀드 (Hold) 기능**: `C` 또는 `Shift` 키로 현재 블록을 보관하거나 교체 (1턴 1회 제한)
* **넥스트 (Next Queue) 3개 미리보기**: 다음에 등장할 3개의 블록을 미니어처로 실시간 렌더링
* **공식 테트리스 점수 체계**:
  * 1줄: $100 \times \text{Level}$ (SINGLE)
  * 2줄: $300 \times \text{Level}$ (DOUBLE)
  * 3줄: $500 \times \text{Level}$ (TRIPLE)
  * 4줄: $800 \times \text{Level}$ (TETRIS! ⭐)
  * **Back-to-Back (B2B)**: 연속 테트리스 달성 시 1.5배 가산점 및 화염 토스트 표출
  * **콤보 (Combo)**: 연속 줄 삭제 시 콤보 누적 가산점 ($50 \times \text{Combo} \times \text{Level}$)
* **레벨업 및 낙하 가속**: 10줄 클리어마다 레벨 상승 및 중력 가속 (최대 100ms까지 단축)

### 3. 시각 연출 및 Web Audio 신디사이저 사운드
* **내장 Web Audio 신디사이저**: 별도 오디오 파일 없이 브라우저 자체 주파수 합성으로 8-bit 사운드 구현 (이동, 회전, 하드드롭 베이스펀치, 줄삭제 화음, 4줄 팡파르, 레벨업, 게임오버)
* **사운드 온/오프 토글**: 우측 상단 `🔊 / 🔇` 버튼으로 즉각 음소거 가능 (설정값 저장)
* **파티클 폭발 이펙트**: 줄이 지워질 때 블록 컬러의 화려한 스파크 파티클 폭발
* **스크린 셰이크 (Screen Shake)**: 하드 드롭 및 4줄 테트리스 클리어 시 역동적인 타격감 화면 진동
* **최고 점수 (TOP SCORE) 영구 보존**: `localStorage`를 통해 브라우저를 닫아도 최고 기록 자동 저장

### 4. 모바일 & 터치스크린 지원
* 반응형 화면 및 스마트폰/태블릿을 위한 터치 가상 패드(D-Pad & Action Buttons) 탑재
* 버튼 길게 누르기(Long Press) 시 연속 이동(Auto-repeat) 지원

---

## 🎮 조작 방법 (Controls)

| 동작 | 키보드 (Keyboard) | 모바일 터치 (Touch) |
| :--- | :--- | :--- |
| **좌 / 우 이동** | `←` / `→` 또는 `A` / `D` | `◀` / `▶` (길게 누르면 연속 이동) |
| **소프트 드롭** | `↓` 또는 `S` (+1점/칸) | `▼` (길게 누르면 연속 하강) |
| **하드 드롭** | `Space` (+2점/칸) | `⚡ DROP` |
| **시계방향 회전** | `↑`, `W`, `X` | `↻` |
| **반시계방향 회전** | `Z` | `↺` |
| **블록 홀드(보관)** | `C` 또는 `Shift` | `HOLD` |
| **일시정지** | `P` | 상단 버튼 |
| **새 게임 / 재시작** | `R` (또는 게임오버 시 `Space`) | `다시 시작` 버튼 |

---

## 🚀 실행 방법

별도의 설치나 웹 서버 설정 없이 실행 가능합니다:

1. 본 저장소를 클론(Clone)하거나 다운로드합니다:
   ```bash
   git clone https://github.com/bambit21/web-tetris.git
   ```
2. `index.html` 파일을 더블 클릭하여 Chrome, Edge, Safari 등 최신 웹 브라우저로 엽니다.

---

## 📁 프로젝트 구조

```
tetris/
├── index.html     # 메인 게임 레이아웃, 캔버스 및 터치 컨트롤러
├── style.css      # 사이버펑크 네온 다크 아케이드 스타일 및 애니메이션
├── tetris.js      # 게임 엔진, 7-Bag, SRS 회전, 파티클, Web Audio 신디사이저
└── README.md      # 프로젝트 설명서
```

---

## 📄 라이선스
MIT License

# Starter CMS 사내 발표 자료

사내 발표를 위한 PPT/대본/시연 시나리오 묶음.

## 파일 구성

| 파일 | 용도 |
|------|------|
| `slides.md` | Marp 기반 발표 슬라이드. PDF/PPTX로 변환 가능 |
| `script.md` | 슬라이드별 말할 대본 (발표자용) |
| `demo-scenarios.md` | 실제 기능 시연 순서와 포인트 (화면 공유 파트) |

## Marp 슬라이드 미리보기 / 변환

### 방법 1: VS Code (가장 쉬움)
1. VS Code 확장 `Marp for VS Code` 설치
2. `slides.md` 열고 우상단 미리보기 버튼
3. 내보내기: 명령 팔레트 → `Marp: Export slide deck` → PDF / PPTX 선택

### 방법 2: 커맨드라인
```bash
npx @marp-team/marp-cli slides.md -o slides.pdf
npx @marp-team/marp-cli slides.md -o slides.pptx
```

## 발표 진행 제안

**총 25~30분** (시연 15분 포함)

1. **도입** (3분) — 표지 ~ 프로젝트 의의
2. **에디션 구조 / Starter 현황** (5분)
3. **기술 스택 / 아키텍처** (3분)
4. **실제 기능 시연** (15분) — `demo-scenarios.md` 참고
5. **장단점 / 로드맵** (3분)
6. **Q&A** (별도)

## 애니메이션 방침

Marp의 `transition: fade`로 슬라이드 간 페이드 전환만 적용 (과한 애니메이션 지양).
핵심 강조는 **색상/크기/배지**로 시각적으로 처리.

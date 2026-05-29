# 이지영 웹 브로슈어

## 파일 구조
```
├── index.html   # 마크업
├── style.css    # 스타일 (반응형 포함)
├── main.js      # 슬라이더 로직 (순수함수로 원자화)
└── README.md
```

## main.js 레이어 구조
```
순수 계산   clamp / nextIndex / toTransform / toPercent ...
상태        createState / moveTo / setBusy
원자 DOM    setTransform / setText / setClass
복합 DOM    render / updateDots / updateArrows
애니메이션  animateEls / animateBars / animateSlide
이벤트      onKey / onSwipe / onWheel
진입점      go()
```


## 문제: `html`의 `overflow`를 바꿀때 긴 시간의 style recalculate 가 발생했다

문제의 출발점은 스크롤 잠금이었다.

```css
html {
  overflow: hidden;
}
```


```css
max-height: calc(8.75lh + 0.5rem);
```
자식 노드중 하나가 lh 를 쓸때 html 의 인라인 style 을 변경하면 긴 시간의 style recalculate 가 발생했다.

## 분석과정

### 1. Performance 탭에서 CSS selector stats 확인

Chrome DevTools의 Performance 탭에서 **Enable CSS selector stats** 옵션을 활성화하고 selector별 통계를 확인했다.

확인 결과, 특정 selector의 `Match Attempts`나 `Match Count`만 높은 것이 아니었다. 모든 selector에서 해당 수치가 높게 나타났다.

따라서 특정 selector가 문제라기보다, 스타일 재계산 범위 자체가 넓게 잡히고 있다고 판단했다.

### 2. Invalidation 확인

모든 selector가 재계산되고 있었기 때문에, 어떤 노드가 invalidation을 일으켰는지 확인할 필요가 있었다.

하지만 Performance 탭만으로는 invalidation의 시작점과 전파 범위를 확인하기 어려웠다. 그래서 Perfetto UI를 별도로 사용해 trace를 분석했다.

그 결과, 특정 subtree가 아니라 전체 트리에서 style recalculate가 발생하는 것을 확인했다.

### 3. 크로니움 코드분석

Chromium 코드를 확인한 결과, 자식 노드가 `lh` 단위를 사용하고 있는 상태에서 `html`의 inline style을 변경하면 전체 트리의 style이 재계산되는 것을 확인했다.

#### Chromium 내부에서는 무슨 일이 일어날까

Chromium 143의 Style Engine에는 루트 글꼴 상대 단위의 유효성을 확인하는 흐름이 있다. 루트 요소의 computed style이 달라지면 `UpdateRootFontRelativeUnits`를 호출하고, 반환값에 따라 자손 전체의 스타일을 다시 계산할 수 있다.

핵심 흐름을 단순화하면 다음과 같다.

```cpp
if (GetDocument().GetStyleEngine().UpdateRootFontRelativeUnits(
        old_style, new_style)) {
  child_change = child_change.EnsureAtLeast(
      StyleRecalcChange::kRecalcDescendants);
}
```

`UpdateRootFontRelativeUnits`는 여러 조건을 합쳐 루트 글꼴 관련 값이 바뀌었는지를 판단한다.

```cpp
bool root_font_changed =
    rem_changed ||
    root_font_glyphs_changed ||
    root_line_height_changed;
```

이 가운데 `root_font_glyphs_changed`는 문서가 글리프 상대 단위를 사용하는지도 확인한다.

```cpp
bool root_font_glyphs_changed =
    !old_root_style ||
    (UsesGlyphRelativeUnits() &&
     old_root_style->GetFont() != new_root_style->GetFont());
```

`UsesGlyphRelativeUnits()`가 참이라는 것은 문서 어딘가에 `lh`처럼 글꼴 또는 줄 높이에 의존하는 단위가 있다는 뜻이다. 루트의 관련 값이 달라졌다고 판단되면 브라우저는 안전하게 자손 전체를 다시 계산한다.

Chromium 144에서는 글꼴 비교가 `ValuesEquivalent<Font>`를 사용하도록 개선됐다. 값이 실질적으로 같은지를 더 정확히 비교해 불필요한 전체 재계산을 줄이는 방향이다. 다만 스크롤바 너비가 실제로 달라지는 환경에서는 별도의 viewport 갱신 경로가 자손 재계산을 유발할 수 있다.

```cpp
if (new_style &&
    GetDocument().GetLayoutView()->SetScrollbarSizesForViewportUnits(
        new_style->UnconditionalScrollbarSize())) {
  GetDocument().GetStyleEngine().UpdateViewportSize();
  child_change = child_change.EnsureAtLeast(
      StyleRecalcChange::kRecalcDescendants);
}
```

예를 들어 classic scrollbar 환경에서 `html`이 `overflow: scroll`인 상태에서 `overflow: hidden`으로 바뀌면 스크롤바가 차지하던 너비가 사라진다. 이 변화는 viewport 단위를 사용하는 요소에 영향을 줄 수 있으므로 전체 자손의 스타일을 다시 계산하는 것이 올바른 동작이다.

즉, 비슷하게 보이는 전체 트리 재계산도 두 경우를 구분해야 한다.

- 값은 같은데 비교 방식 때문에 넓게 무효화되는 경우
- 스크롤바 너비나 viewport가 실제로 바뀌어 재계산이 필요한 경우


## 해결
html css 를 변경하지 않고 body css 를 변경하도록 변경


## 참고

- [[✅ base-ui-3793]]
- [Base UI PR #3793](https://github.com/mui/base-ui/pull/3793)
- [MDN: CSS length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length)
(https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/css/style-invalidation.md


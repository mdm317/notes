
### 143 버젼

```cpp nums
// element.cc  =>  RecalcOwnStyle
if (diff == ComputedStyle::Difference::kEqual) {}
else{
	if (GetDocument().GetStyleEngine().UpdateRootFontRelativeUnits(
	              old_style, new_style)) {
	    child_change = child_change.EnsureAtLeast(StyleRecalcChange::kRecalcDescendants);
	      }
}


```

(2) style 이 변경되었다면 

(4) UpdateRootFontRelativeUnits ⬇️
```cpp
// style_engine.cc => UpdateRootFontRelativeUnits
bool root_font_changed = 
	rem_changed || root_font_glyphs_changed || root_line_height_changed;
return root_font_changed

```

root_font_changed 가 true 일때 `UpdateRootFontRelativeUnits` true 반환

그 중 root_font_glyphs_changed ⬇️
```c++

  bool root_font_glyphs_changed =
	  !old_root_style ||
	  (UsesGlyphRelativeUnits() &&
	  old_root_style->GetFont() != new_root_style->GetFont());

```

`UsesGlyphRelativeUnits` 자식노드가 GlyphRelativeUnits 단위를 사용한다면 true 를 반환
`UsesGlyphRelativeUnits` 예시 `max-height: calc(8.75lh + 0.5rem);`
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length

```cpp

bool rem_changed = !old_root_style || old_root_style->SpecifiedFontSize() !=

new_root_style->SpecifiedFontSize();

```
font size 가 바뀌다면 true `rem_changed` 는 true

결국 
html 의 style 이 변경되었고
 - font size 변경
 - 자식노드가 GlyphRelativeUnits 사용
 - root_line_height_changed 가 true
 이런 경우에는  `full document recalc` 발생

### 144 버젼

```cpp

bool root_font_glyphs_changed =
  !old_root_style ||
  (UsesGlyphRelativeUnits() &&
   (base::FeatureList::IsEnabled(blink::features::kCSSFontComparisonFix)
		? !base::ValuesEquivalent<Font>(old_root_style->GetFont(),
										new_root_style->GetFont())
		: old_root_style->GetFont() != new_root_style->GetFont()));

```

위의 코드에서 `root_font_glyphs_changed` 동작이 개선되어서 
`html style 변경` && `font 변경`  => `full document recalc` 발생

#### 추가된 조건문

```c++
// element.cc  =>  RecalcOwnStyle
     if (new_style &&
          GetDocument().GetLayoutView()->SetScrollbarSizesForViewportUnits(
              new_style->UnconditionalScrollbarSize())) {
        GetDocument().GetStyleEngine().UpdateViewportSize();
        GetDocument()
            .GetStyleResolver()
            .InvalidateMatchedPropertiesCacheForViewportUnits();
        child_change =
            child_change.EnsureAtLeast(StyleRecalcChange::kRecalcDescendants);
      }

```

scrollbar 의 가로 길이가 달라지면 전체트리 reflow 추가
##### 간단 예시
classic scrollbar 사용 + html overflow-scroll 상태에서  
overflow:hidden 으로 변경하면  
→ full document recalc 발생

확인법
- chronium 소스파일에 직접 테스트코드 구현
	- `StyleForElementCount`, `USE_NON_OVERLAY_SCROLLBARS_OR_QUIT` 활용
- perfetto ui 를 이용해서 관찰
- devtools-frontend 커스텀해서 확인
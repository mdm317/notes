### Scrol
두가지 존재
- OverlayScrollbar 
- Classic scrollbars 
	- inset (가로길이를 가지는)
cronium 에서는 `bool LayoutBox::UsesOverlayScrollbars()` 이 메소드로 확인

맥 setting -> apperance
show scroll bars 옵션
- always
	- inset scrollbar
- when scrolling
	- overlay scrollbar
- automatically based on mouse or trackpad
	- 마우스 연결시 inset scrollbar
	- 아닐시 overlay scrollbar

### scrollbar-gutter

The browser determines whether _classic_ scrollbars or _overlay_ scrollbars are used:

- Classic scrollbars are always placed in a gutter, consuming space when present.
- Overlay scrollbars are placed over the content, not in a gutter, and are usually partially transparent.


`scrollbar-gutter : stable`
When using classic scrollbars, the gutter will be present if `overflow` is `auto`, `scroll`, or `hidden` even if the box is not overflowing. When using overlay scrollbars, the gutter will not be present.

출처 : [mdn](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scrollbar-gutter)

핵심은 classic scrollbar 를 사용시에 overflow 가 auto , scroll, hidden 일경우에 box 가 모두 같은 크기로 되게 만들어준다. 
overlay scrollbar 의 경우에는 gutter 가 없다.


```cpp
bool LayoutBox::HasScrollbarGutters(){
 //...some code
	return StyleRef().IsHorizontalWritingMode() &&
           (overflow == EOverflow::kAuto || 
            overflow == EOverflow::kScroll ||
            overflow == EOverflow::kHidden) &&
           !UsesOverlayScrollbars() &&
           GetNode() != GetDocument().ViewportDefiningElement();
}


```
cronium 코드에서도 !UsesOverlayScrollbars 가 아닐떄만 HasScrollbarGutters 가 true 값을 가진다.



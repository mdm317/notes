
https://github.com/mui/base-ui/pull/3793

in style_engine.cc
```c++

bool root_font_changed = 
	rem_changed || root_font_glyphs_changed || root_line_height_changed;

```
root_font_changed 가 변화되면 모든 트리 recalc style

chromium 133 이하

```c++

  bool root_font_glyphs_changed =
	  !old_root_style ||
	  (UsesGlyphRelativeUnits() &&
	  old_root_style->GetFont() != new_root_style->GetFont());

```
이버젼에서는 UsesGlyphRelativeUnits 단위를 사용하고 있고 html 의 style 이 변경되면 무조권 every tree recalc style

chromium 134 초과
```c++

  bool root_font_glyphs_changed =
      !old_root_style ||
      (UsesGlyphRelativeUnits() &&
       (base::FeatureList::IsEnabled(blink::features::kCSSFontComparisonFix)
            ? !base::ValuesEquivalent<Font>(old_root_style->GetFont(),
                                            new_root_style->GetFont())
            : old_root_style->GetFont() != new_root_style->GetFont()));

```
font 가 다를떄만 recalc style

cc. [[reacalculate style]]



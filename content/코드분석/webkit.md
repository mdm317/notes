## setting

### Get code
```
git clone https://github.com/WebKit/WebKit.git WebKit
```
https://webkit.org/getting-the-code/

### 빌드
```
Tools/Scripts/build-webkit --debug
```
### Debug

#### 실제 safari 를 실행해서 WTFLogAlways 를 볼 수 있음

```
Tools/Scripts/run-minibrowser <링크> --debug

```

####   Layout Tests 
window.internals 를 이용해서 테스트 가능
##### 예시 코드
```html

<!doctype html>
<html>
  <head>
    <script src="../../resources/js-test-pre.js"></script>
    <style>
      .test {
        position: relative;
      }

      .foo {
        font-size: 10px;
      }

      .bar {
      }
    </style>
  </head>
  <body>
    <div>hello</div>
    <script>
      function setStyleAndForceLayout(changeFunc) {
        if (window.internals) {
          internals.updateLayoutIgnorePendingStylesheetsAndRunPostLayoutTasks();
          internals.startTrackingStyleRecalcs();
        }
        if (window.testRunner) testRunner.dumpAsText();

        changeFunc();

        var numStyleRecalcs = 0;
        if (window.internals) {
          internals.updateLayoutIgnorePendingStylesheetsAndRunPostLayoutTasks();
          numStyleRecalcs = internals.lastStyleUpdateSize;
        }
        return numStyleRecalcs;
      }

      description(
        "Test to count the number of recalcStyle calls on inline style and class changes.",
      );

      var testContainer = document.documentElement;

      var style = testContainer.style;

      var numStyleRecalcs = setStyleAndForceLayout(function () {
        style.overflow = "hidden";
      });
      document.write("\nnumStyleRecalcs : " + numStyleRecalcs);

      numStyleRecalcs = setStyleAndForceLayout(function () {
        style.fontSize = "10px";
      });
      document.write("\nnumStyleRecalcs : " + numStyleRecalcs);

    </script>
    <script src="../../resources/js-test-post.js"></script>
  </body>
</html>


```
##### 결과
```

Test to count the number of recalcStyle calls on inline style and class changes.

On success, you will see a series of "PASS" messages, followed by "TEST COMPLETE".


PASS successfullyParsed is true

TEST COMPLETE
hello
numStyleRecalcs : 1 numStyleRecalcs : 10


```
https://docs.webkit.org/Build%20%26%20Debug/Tests.html#running-layout-tests

#### recalc 로직

```cpp 

auto TreeResolver::computeDescendantsToResolve(const ElementUpdate& update, const RenderStyle* existingStyle, Validity validity) const -> DescendantsToResolve
{
    if (parent().descendantsToResolve == DescendantsToResolve::All) {
        return DescendantsToResolve::All;
    }
    if (validity >= Validity::SubtreeInvalid) {
        return DescendantsToResolve::All;
    }

    if (update.changes && existingStyle) {
        auto customPropertyInStyleContainerQueryChanged = [&] {
            auto& namesInQueries = scope().resolver->ruleSets().customPropertyNamesInStyleContainerQueries();
            for (auto& name : namesInQueries) {
                // Any descendant may depend on this changed custom property via a style query.
                if (!existingStyle->customPropertyValueEqual(*update.style, name))
                    return true;
            }
            return false;
        }();
        if (customPropertyInStyleContainerQueryChanged) {
            return DescendantsToResolve::All;
        }
    }

    if (update.changes.containsAny({ Change::Container, Change::Renderer })) {
        return DescendantsToResolve::All;
    }

    if (update.changes.containsAny(inheritedChanges())) {
        return DescendantsToResolve::Children;
    }

    if (update.changes.contains(Change::NonInherited)){
        return DescendantsToResolve::ChildrenWithExplicitInherit;
    }

    ASSERT(!update.changes);
    return DescendantsToResolve::None;
};

```
(4) parent 가 all 이면 all
(32) font size 는 Inherit
(34) overflow 속성은 inherit 이라

```cpp nums
// auto TreeResolver::resolveElement
//    ...
    bool isDocumentElement = &element == m_document->documentElement();
    if (isDocumentElement) {
        if (styleChangeAffectsRelativeUnits(*update.style, existingStyle)) {
            // "rem" units are relative to the document element's font size so we need to recompute everything.
            scope().resolver->invalidateMatchedDeclarationsCache();
            descendantsToResolve = DescendantsToResolve::All;
        }
    }

```
html 에서 font-size 를 변경한 경우
font size 는 이후 `DescendantsToResolve::All;` 로 변경 
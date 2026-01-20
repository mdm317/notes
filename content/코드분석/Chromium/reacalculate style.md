
어떤 요소의 style 을 재계산하는 시간에 대해 디버깅을 위해 정리
확실하지 않은 부분도 있어서 그런부분은 gray 색으로 표현
## 간단한 설명

![[Screenshot 2026-01-16 at 1.05.54 AM.png]]
So style calculation is about figuring out which elements have which CSS rules. The output of this is called the ["layout tree" (or "render tree")](https://browser.engineering/layout.html#the-layout-tree).

Let's take a simple example. In this case, we have a 5px-padding h1 and a 10px-padding h2. So style calculation is the process of figuring out that
https://www.youtube.com/watch?v=nWcexTnvIKI

## 발생 원인

## forced-reflow
참고
https://developer.chrome.com/docs/performance/insights/forced-reflow

## invalidation
### class

<p class="gray">css tree 파싱후에 class_invalidation_sets 을 생성 </p>

| Order | perfetto slice name                  | 의미              |
| ----- | ------------------------------------ | --------------- |
| 1     | StyleInvalidatorInvalidationTracking | invalidation 감지 |
| 2     | StyleRecalcInvalidationTracking      | recalc 대상 확정    |
| 3     | StyleResolver::ResolveStyle          | 실제 스타일 계산       |
devtools 에서 생성된 invalidation은 못보는것으로 확인
[invalidation 디자인노트](https://docs.google.com/document/d/1vEW86DaeVs4uQzNFI5R-_xS9TcS1Cs_EUsHRSgCHGu8/edit?pli=1&tab=t.0#heading=h.xa3ovcncd2vp)

Changes in the DOM that require updates to styles
참고 https://chromium.googlesource.com/chromium/src/+/master/third_party/blink/renderer/core/css/style-invalidation.md


## 디버깅
### example code for class invalidation

```html

<!DOCTYPE html>
<html>
  <head>
    <style>
      .parent .child {
        color: red;
      }
    </style>
    <title>invalidate test</title>
  </head>
  <body>
    <h1>InvalidationSet Trace Test</h1>

    <button onclick="testBox.classList.add('parent')">Add .parent</button>
    <button onclick="testBox.classList.add('container')">Add .container</button>

    <div id="testBox">
      <div>
        <div class="child">Child 1</div>
      </div>
    </div>
  </body>
</html>


```


### `<div class="child">Child 1</div>` 의 스타일 재계산까지의 흐름


 - parent class 를 추가한 testBox 에서는 실제 재계산을 일어나지 않음
- .child 에서만 재계산 일어남
- 그러나 .child 를 찾는 과정에서의 연산은 존재

| Step | perfetto slice name                  | Target Node          | Reason / Note                         |
| ---- | ------------------------------------ | -------------------- | ------------------------------------- |
| 1    | ScheduleStyleInvalidationTracking    | `DIV#testBox.parent` | invalidatedSelectorId: **class**      |
| 2    | StyleInvalidatorInvalidationTracking | `DIV#testBox.parent` | Element has pending invalidation list |
| 3    | StyleInvalidatorInvalidationTracking | `DIV.child`          | Invalidation set matched class        |
| 4    | StyleRecalcInvalidationTracking      | `DIV.child`          | Related style rule                    |
| 5    | StyleResolver::ResolveStyle          | `DIV.child`          | final style resolution                |


### 주의점
class invalidation 과는 별개로 Button 도 StyleRecalcInvalidationTracking 가 호출되고 style이 재 계산됨 

| Field     | Value                           |
| --------- | ------------------------------- |
| Name      | StyleRecalcInvalidationTracking |
| nodeName  | BUTTON                          |
| subtree   | false                           |
| reason    | PseudoClass                     |
| extraData | `:active`                       |

***


![[Screenshot 2026-01-16 at 10.02.14 PM.png]]
performace 탭에는
UpdateLayoutTree 전체가 recalculate style 로 표시된다.






https://docs.google.com/document/d/1vEW86DaeVs4uQzNFI5R-_xS9TcS1Cs_EUsHRSgCHGu8/edit?pli=1&tab=t.0#heading=h.nrbor451aqtj
### setup
[프론트엔드 레포](https://github.com/ChromeDevTools/devtools-frontend)
[세팅법](
https://chromium.googlesource.com/devtools/devtools-frontend/+/main/docs/get_the_code.md)


녹화했을때 이벤트를 수집하는 코드 
front_end/services/tracing/PerformanceTracing.ts
```ts

    const categories = [
      '-*',
      'blink.console',
      'blink.user_timing',
      'devtools.timeline',
      'disabled-by-default-devtools.screenshot',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.invalidationTracking',
      'disabled-by-default-devtools.timeline.frame',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profiler',
      'disabled-by-default-v8.cpu_profiler.hires',
      'latencyInfo',
      'loading',
      'disabled-by-default-lighthouse',
      'v8.execute',
      'v8',
    ].join(',');

    const started = await this.#tracingManager.start(this, categories);

```
CDP(Chrome DevTools Protocol) 호출
# performace 탭
## Frame 이란
[[Frame chromium]]

## Recalculate style

### UpdateLayoutTree
TraceEvents.ts
```ts

  /** The real trace event is called 'UpdateLayoutTree' but we've aliased it for convenience. */
  RECALC_STYLE = 'UpdateLayoutTree',

```

실제로 (perfetto ui) 에서는 'UpdateLayoutTree' 로 보임
> perfetto ui 에서 보이는 이벤트 [[recalculate style#주의점]]
### Forced reflow  경고

processForcedReflowWarning 의 일부 코드 
```ts nums 

function processForcedReflowWarning(event: Types.Events.Event): void {
  if (jsInvokeStack.length) {
    // Current event falls inside a JS call.
  }
  if (allEventsStack.length === 1) {
    const totalTime = taskReflowEvents.reduce((time, event) => time + (event.dur || 0), 0);
    if (totalTime >= FORCED_REFLOW_THRESHOLD) {
      taskReflowEvents.forEach(reflowEvent => storeWarning(reflowEvent, 'FORCED_REFLOW'));
    }
  }
}

```
(3) 현재 js stack 이 있고
(4) recalculate style + layout 시간이 FORCED_REFLOW_THRESHOLD 보다 클떄 
(9) Forced reflow  경고 발생
경고가 없더라도 Function stack 영역이 존재하다면 `forced reflow`  발생

### First invalidated

```ts

export function isInvalidationTracking(event: Event): event is InvalidationTrackingEvent {
  return isScheduleStyleInvalidationTracking(event) || isStyleRecalcInvalidationTracking(event) ||
      isStyleInvalidatorInvalidationTracking(event) || isLayoutInvalidationTracking(event);
}

```
이런 이벤트 일시 저장했다가 reacalculate style 발생시 표시t

실제로는 훨씬 많은 기능이 있지만 가장 간단하게 표현


setState 호출 
(ReactFiberHooks.js)
dispatchSetState  => dispatchSetStateInternal => scheduleUpdateOnFiber 

(ReactFiberWorkLoop.js)
ensureRootIsScheduled => ensureScheduleIsScheduled => scheduleImmediateRootScheduleTask
```Typescript {'title':'scheduleImmediateRootScheduleTask.ts'}
function scheduleImmediateRootScheduleTask() {
  // ...some code
  if (supportsMicrotasks) {
    scheduleMicrotask(() => {
      // ...some code
      processRootScheduleInMicrotask();
    });
  } else {
    // If microtasks are not supported, use Scheduler.
    Scheduler_scheduleCallback(
      ImmediateSchedulerPriority,
      processRootScheduleInImmediateTask,
    );
  }
}
```

scheduleMicrotask 는 내부적으로 브라우저의 queueMicrotask api 를 사용하게 되어있음
react-dom-bindings/src/client 참고

scheduleMicrotask 를 호출하고 dispatchSetState 함수는 종료
main thread 가 비었으므로 브라우저에서 scheduleMicrotask 에 전달한 함수 실행

(ReactFiberRootScheduler.js)
processRootScheduleInMicrotask  => scheduleTaskForRootDuringMicrotask => scheduleCallback => Scheduler_scheduleCallback(priorityLevel, callback);

```Typescript {'title':'scheduleTaskForRootDuringMicrotask.ts'}
scheduleCallback(
      schedulerPriorityLevel,
      performWorkOnRootViaSchedulerTask.bind(null, root),
);
```

scheduleCallback 를 호출하고 processRootScheduleInMicrotask 종료 

schedule 코드에서 performWorkOnRootViaSchedulerTask 실행

(ReactFiberRootScheduler.js)
performWorkOnRootViaSchedulerTask 
(ReactFiberWorkLoop.js)
=> performWorkOnRoot

```Typescript {'title':'performWorkOnRoot.ts'}
  let exitStatus: RootExitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes, true);
```
performWorkOnRoot 의 내부에서 renderRootConcurrent 랑 renderRootSync 를 결정
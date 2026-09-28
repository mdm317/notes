---
created: 2026-09-10T15:37:59.000Z
---

19.3 기준  
# 리액트의 Rendering  

리액트의 랜더링을 두개로 나눈다면 다음과 같이 나눌수 있다고 생각한다.  

  1. Update Queueing  
  2. Update Processing  

리액트 공식 문서는 화면이 업데이트되는 과정을 아래와 같이 나누었다.  

1. **Trigger**: 렌더링을 요청한다.  
2. **Render**: 컴포넌트를 호출해 다음 화면에 표시할 UI를 계산한다.  
3. **Commit**: 계산한 결과를 DOM에 반영한다.  

[공식 문서: Render and Commit](https://react.dev/learn/render-and-commit)  
## Trigger 단계  

`useState`가 반환하는 set 함수(set function)를 호출하면 내부적으로 다음 순서로 호출된다.  

```text
set 함수 → dispatchSetState → dispatchSetStateInternal
```

`dispatchSetStateInternal`의 구현을 보면 Trigger 단계가 하는 두 가지 일이 그대로 드러난다.  

- **업데이트할 데이터를 저장** — `enqueueConcurrentHookUpdate`  
- **업데이트를 스케줄링** — `scheduleUpdateOnFiber`  

```ts
// dispatchSetStateInternal의 코드 일부
const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
if (root !== null) {
  scheduleUpdateOnFiber(root, fiber, lane);
  entangleTransitionUpdate(root, queue, lane);
  return true;
}
```

### 업데이트할 데이터를 저장  

`enqueueConcurrentHookUpdate`는 내부에서 `enqueueUpdate`를 호출하고, `enqueueUpdate`는 **`concurrentQueues`라는 임시 배열에 업데이트 하나당 네 개의 값을 연속으로 저장한다.**   

```ts
// enqueueUpdate의 핵심 저장 코드
concurrentQueues[concurrentQueuesIndex++] = fiber;
concurrentQueues[concurrentQueuesIndex++] = queue;
concurrentQueues[concurrentQueuesIndex++] = update;
concurrentQueues[concurrentQueuesIndex++] = lane;
```

| 저장하는 값 | 담긴 데이터 |  
| --- | --- |  
| `fiber` | 업데이트 대상 컴포넌트의 Fiber 참조 |  
| `queue` | 해당 `useState` Hook의 업데이트 큐 참조 |  
| `update` | 전달한 값이나 함수(`action`), 우선순위(`lane`) 등을 담은 업데이트 객체 |  
| `lane` | 이번 업데이트의 우선순위 등을 구분하는 정보 |  

### 스케쥴러에 업데이트가 필요하다고 등록  

업데이트를 큐에 등록한 뒤, `scheduleUpdateOnFiber(root, fiber, lane)`을 호출해 **루트에 처리할 작업이 있음을 표시하고 실행을 예약한다.**  

1. **루트에 대기 중인 업데이트를 표시한다.** `markRootUpdated`가 `root.pendingLanes`에 업데이트의 `lane` 을 추가한다.  

   ```ts
   // ReactFiberLane.js > markRootUpdated()
   root.pendingLanes |= updateLane;
   ```

2. **마이크로태스크를 예약한다.** 이미 등록된 루트와 마이크로태스크는 중복 예약하지 않는다.  

   ```ts
   // ReactFiberRootScheduler.js > ensureScheduleIsScheduled()
   
   // 한번만 예약
   if (!didScheduleMicrotask) {
     didScheduleMicrotask = true;
     scheduleImmediateRootScheduleTask();
   }
   // 마이크로태스크 예약
	scheduleMicrotask(() => {
	  processRootScheduleInMicrotask();
	});
   ```
   

## Rendering 단계  

렌더링 단계에서 React는 컴포넌트를 호출하고, 업데이트를 처리해 다음 상태를 계산한다.  

### 렌더링 작업 스케쥴링  

동기 작업은 `Scheduler` 작업 큐를 거치지 않고 마이크로태스크 끝에서 직접 처리한다.  
동기 작업이 아니면 messagechannel 을 이용해서 스케쥴링 한다.  

```ts
// ReactFiberRootScheduler.js > scheduleTaskForRootDuringMicrotask()
const newCallbackNode = scheduleCallback(
  schedulerPriorityLevel,
  performWorkOnRootViaSchedulerTask.bind(null, root),
);
root.callbackPriority = newCallbackPriority;
root.callbackNode = newCallbackNode;
```

`Scheduler`는 콜백을 담은 작업을 `taskQueue`에 넣고, 필요한 경우 실행 기회를 요청한다.  

```ts
// Scheduler.js > unstable_scheduleCallback()
// 지연 없는 작업 경로
newTask.sortIndex = expirationTime;
push(taskQueue, newTask);

if (!isHostCallbackScheduled && !isPerformingWork) {
  isHostCallbackScheduled = true;
  requestHostCallback();
}
```

일반 브라우저에서는 `MessageChannel` 을 이용해서 랜더링 작업을 스케쥴링한다.  

```ts
// Scheduler.js
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

schedulePerformWorkUntilDeadline = () => {
  port.postMessage(null);
};
```

### 임시 배열의 업데이트를 Hook 큐에 연결한다  

스케줄링된 작업이 실행되어 Render 단계가 시작되면 [[#업데이트할 데이터를 저장|`concurrentQueues`]]에 모아 둔 업데이트를 `fiber` 의 `hook` 의 `queue.pending` 에 연결하는 작업을 한다.  
이 작업은 `finishQueueingConcurrentUpdates`를 통해 이루어진다. (랜더링이 끝났을때도 실행됨)  

`finishQueueingConcurrentUpdates` 가 호출되는 스택은 밑과 같다.  
```text
performWorkOnRoot
  → renderRootSync (renderRootConcurrent)
      → prepareFreshStack
          → finishQueueingConcurrentUpdates
      → workLoopSync
```

#### 저장된 update 데이터   

`fiber`의 `memoizedState`에 있는 Hook의 `queue`에 저장되는 업데이트 데이터는 circular linked list 형태다.  
`queue.pending`은 가장 최근 업데이트를 가리키고 이어지는 `next`는 호출된 순서를 따른다.  

```
setState(1)
setState(2)
setState(3)
setState(4)
setState(5)
```

이렇게 호출했다면 저장되는 구조는 다음과 같다. 아래 `숫자`는 각 update의 `action` 값이다.  

```text
queue.pending → 5 → 1 → 2 → 3 → 4 → (다시 5)
```

`queue.pending`은 마지막 호출인 `setState(5)`의 update(`action: 5`)를 가리키고, `queue.pending.next`부터는 호출 순서인 `action: 1 → 2 → 3 → 4`로 이어진다.  

저장되는 update 객체는 아래 필드로 이루어져 있다.  

```ts
{
  lane,          // 이 업데이트의 우선순위
  revertLane,    // transition 되돌림용 lane
  gesture,       // gesture 관련(일반 경우 null)
  action,        // 전달한 값 또는 업데이터 함수
  hasEagerState, // 다음 상태를 미리 계산했는지
  eagerState,    // 미리 계산한 다음 상태
  next,          // 다음 update (원형 리스트 연결)
}
```

`action`에는 set 함수에 넘긴 값이 그대로 저장된다. `setCount(3)`처럼 값을 넘기면 `action: 3`이 되고, `setCount(v => v + 1)`처럼 함수를 넘기면 그 함수 자체가 `action`에 저장되어 렌더링 시점에 호출된다.  

> [!note]- `Counter` Fiber의 `memoizedState` 실제 값  
>  
> ```ts  
> setState(2)  
> setState(3)  
> ```  
>호출 시에 랜더링 직전에 `fiber` 의 `memoizedState` 의 `queue` 에 저장되는 값  
>  
> ```text  
> memoizedState: {  
>   ...  
>   queue: {  
>     pending: <ref *1> {  
>       lane: 32,  
>       revertLane: 0,  
>       gesture: null,  
>       action: 3,  
>       hasEagerState: false,  
>       eagerState: null,  
>       next: {  
>         lane: 32,  
>         revertLane: 0,  
>         gesture: null,  
>         action: 2,  
>         hasEagerState: true,  
>         eagerState: 2,  
>         next: [Circular *1]  
>       }  
>     },  
>     lanes: 0,  
>     dispatch: [Function: bound dispatchSetState],  
>     lastRenderedReducer: [Function: basicStateReducer],  
>     lastRenderedState: 0  
>   },  
> ```  
>  
> - `pending`은 마지막 업데이트인 `action: 3`을 가리킨다.  
> - `pending.next`는 첫 번째 업데이트인 `action: 2`를 가리킨다.  
> - `[Circular *1]`은 다시 `action: 3`의 업데이트 객체로 연결된다는 뜻이다.  
> - `hasEagerState: true`와 `eagerState: 2`는 첫 업데이트의 다음 상태를 미리 계산해 두었음을 보여 준다.  
>  
> 로그의 `lane: 32` 같은 내부 값은 실행 조건과 React 버전에 따라 달라질 수 있다.  
>  

### 상태 계산및 보존  
rendering 단계에서 component 를 실행하고 `useState` 훅을 실행하게되면 그 상태를 계산한다.  
```ts
useState(0)
	→ updateState()
		→ updateReducer()
		  → updateReducerImpl()
```

우선순위가 다른 업데이트는 여러 렌더링에 나누어 처리될 수 있다.   
이때 React는 **먼저 등록한 업데이트를 나중에 처리하더라도 최종 상태 계산에는 등록 순서를 유지**해야 한다.  

이를 위해 컴포넌트를 렌더링하면서 두 가지 작업을 함께 수행한다.  
  - `state` 계산  
  - `baseQueue` 큐 구성: 다음 렌더에서 재처리할 업데이트를 `baseQueue` 에 보관한다.  
  -   
#### update별 처리 분기 — `state` 반영과 `baseQueue` 보존 관점에서  

```d2
direction: right
classes: {
  decision: {shape: diamond; style.fill: "#FEF3C7"; style.stroke: "#475569"; style.font-size: 34; width: 360; height: 320}
  leaf: {shape: circle; style.fill: "#E8F0FE"; style.stroke: "#475569"; style.font-size: 44; width: 150; height: 150}
  term: {shape: oval; style.stroke: "#475569"; style.font-size: 34; width: 220; height: 200}
}

start: "update" {class: term}
q1: "In\nrenderLanes?" {class: decision}
q2: "revertLane\nexists?" {class: decision}
q3: "revertLane\nIn renderLanes?" {class: decision}
q4: "앞서 보존한\nupdate 있음?" {class: decision}
p1: "①" {class: leaf}
p2: "②" {class: leaf}
p3: "③" {class: leaf}
p4: "④" {class: leaf}
p5: "⑤" {class: leaf}

start -> q1
q1 -> p1: N {style.font-size: 34}
q1 -> q2: Y {style.font-size: 34}
q2 -> q4: N {style.font-size: 34}
q2 -> q3: Y {style.font-size: 34}
q4 -> p2: Y {style.font-size: 34}
q4 -> p3: N {style.font-size: 34}
q3 -> p4: Y {style.font-size: 34}
q3 -> p5: N {style.font-size: 34}
```

- **In renderLanes?** — `update.lane`이 이번 렌더의 `renderLanes`에 포함되는가 (`isSubsetOfLanes`)  
- **revertLane exists?** — `update.revertLane !== NoLane` 여부 (optimistic 업데이트)  
- **revertLane In renderLanes?** — `update.revertLane`이 `renderLanes`에 포함되는가  
- **앞서 보존한 update 있음?** — 새 `baseQueue`에 이미 보존된 update가 있는가  

##### 결과 노드 표  

| 노드  | 이번 렌더에서 update 반영 | update를 `baseQueue` 에 보존                    |  
| --- | ----------------- | ----------------------------------------- |  
| ①   | **반영하지 않음**       | **보존** · `lane`·`revertLane` 유지           |  
| ②   | **반영**            | **보존** · `lane = NoLane`                  |  
| ③   | **반영**            | **제외**                                    |  
| ④   | **반영하지 않음**       | **제외**                                    |  
| ⑤   | **반영**            | **보존** · `lane = NoLane`, `revertLane` 유지 |  

- **반영** — 이 update를 `state` 에 반영  
- **반영하지 않음** — 이 update를 건너뛰고 기존 `state` 유지  
- **보존** — 새 `baseQueue`에 복제해 다음 렌더에서 재처리 (`lane`/`revertLane`은 표대로 조정)  
- **제외** — 새 `baseQueue`에 넣지 않음. ③은 이번 계산에 반영했고 재처리가 필요 없어서, ④는 optimistic update를 되돌릴 시점이어서 제외  

# 예제  

```ts

import { useOptimistic, useState, startTransition } from "react";

const wait = () => new Promise((resolve) => setTimeout(resolve, 1000));

export default function App() {
  const [count, setCount] = useState(1);
  const [optimisticCount, add] = React.useOptimistic(
    count,
    (value, amount) => value + amount,
  );

  function onClick() {
    startTransition(async () => {
      add(1); 
      //server call
      await wait()
      // store
      setCount((value) => value + 1);
    });
  }

  return (
    <>
      <button onClick={onClick}>Add 1</button>
      <p>count: {count}</p>
      <p>optimisticCount: {optimisticCount}</p>
    </>
  );
}


```

이 코드는 `onClick` 이 실행되었을때 optimistic ui 를 적용하고 서버에 call 을 보내고 외부 저장소를 이용해 동기화 하는 부분을 간략히 재현한 예제 코드이다.  

```ts
await wait()
// store
setCount((value) => value + 1);
```

`await wait()` 로 서버 응답을 기다리는 코드를 흉내 낸다.  

`setCount((value) => value + 1)`  
원래 React 권장 방식은 `await` 뒤의 업데이트도 다음처럼 `startTransition` 으로 다시 감싸는 것이다.  

```ts
startTransition(() => {
    setCount(2);
});
```

https://react.dev/reference/react/useTransition#react-doesnt-treat-my-state-update-after-await-as-a-transition  

여기서 일부러 감싸지 않은 이유는, `useSyncExternalStore` 로 구독한 외부 스토어 갱신처럼 transition 으로 낮출 수 없는 blocking 업데이트를 `useState` 로 재현하기 위해서다.  

## 상태 업데이트 과정  

### trigger 1  

`add(1)` 가 실행되면 `optimisticCount`(hook data) 의 `queue.pending` 에 아래 update 객체가 쌓인다.  

```ts
{
  lane: 2,
  revertLane: 256, // optimistic 되돌림용 lane
  action: 1,
},
```

### rendering 1  

`renderLanes: 2` — `add(1)` 의 optimistic update(`SyncLane`)로 시작된 렌더.  

> [!note]- 랜더링에 사용될 hook 객체 `fiber.memoizedState` 의 실제 값  
>  
> ```diff  
> {  
>   memoizedState: 1,  
>   baseState: 1,  
>   baseQueue: null,  
>   queue: {  
>     pending: null,  
>     lanes: 0,  
>     dispatch: [Function: bound dispatchSetState],  
>     lastRenderedReducer: [Function: basicStateReducer],  
>     lastRenderedState: 1  
>   },  
>   next: {  
>     memoizedState: 1,  
>     baseState: 1,  
>     baseQueue: null,  
>     queue: {  
> +      pending: <ref *1> {  
> +        // 추가된 update 값  
> +        lane: 2,  
> +        revertLane: 256,  
> +        gesture: null,  
> +        action: 1,  
> +        hasEagerState: false,  
> +        eagerState: null,  
> +        next: [Circular *1]  
> +      },  
>       lanes: 0,  
>       dispatch: [Function: bound dispatchOptimisticSetState],  
>       lastRenderedReducer: null,  
>       lastRenderedState: null  
>     },  
>     next: null  
>   }  
> }  
> ```  

**판단 경로**  
- `useOptimistic`: `update.lane`(`2`) 포함 O → `revertLane`(`256`) 있음 → `revertLane` 미포함 → [[#결과 노드 표]] **⑤번**  

**처리**  
- 반영: `action` 을 실행해 `optimisticCount` 의 다음 상태(`memoizedState`)를 `1 → 2` 로 계산한다.  
- 보존: 다음 렌더에서 되돌릴 수 있도록 `baseQueue` 에 복제해 두되, 이미 이번 렌더에 반영했으므로 `lane` 은 `NoLane(0)` 으로 바꾸고 `revertLane` 은 유지한다.  

`baseQueue`에 보존되는 형태는 다음과 같다.  

```ts
{
  lane: 0,          // NoLane 으로 조정
  revertLane: 256,  // 되돌림 시점 판단용으로 유지
  action: 1,
},
```

### commit 1  
```tsx
<button>Add 1</button>
<p>count: 1</p>
<p>optimisticCount: 2</p>
```
### rendering 2  
`await wait()` 이 실행되어서 제어권이 다시 넘어오고   
`revertLane` (256) 으로 랜더링을 시도한다.  

> [!note]- 랜더링에 사용될 hook 객체 `fiber.memoizedState` 의 실제 값  
>  
> ```diff  
> {  
>   memoizedState: 1,  
>   baseState: 1,  
>   baseQueue: null,  
>   queue: {  
>     pending: null,  
>     lanes: 0,  
>     dispatch: [Function: bound dispatchSetState],  
>     lastRenderedReducer: [Function: basicStateReducer],  
>     lastRenderedState: 1  
>   },  
>   next: {  
>     memoizedState: 2,  
>     baseState: 1,  
> +    baseQueue: <ref *1> {  
> +      lane: 0,  
> +      revertLane: 256,  
> +      gesture: null,  
> +      action: 1,  
> +      hasEagerState: false,  
> +      eagerState: null,  
> +      next: [Circular *1]  
> +    },  
>     queue: {  
>       pending: null,  
>       lanes: 0,  
>       dispatch: [Function: bound dispatchOptimisticSetState],  
>       lastRenderedReducer: [Function (anonymous)],  
>       lastRenderedState: 2  
>     },  
>     next: null  
>   }  
> }  
> ```  

 React는 렌더 중 업데이트를 처리하면서, 해당 업데이트의 `lane` 이 진행 중인 비동기 Action의  
`currentEntangledLane` (`startTransition` 에서 설정)과 같은지 확인한다. 해당 업데이트를 처리했고 결과 상태가 기존 상태와 달라 졌다면 Action 완료를 기다리는 thenable을 throw하여 현재 렌더를 일시 중단한다. Action이 완료되면 렌더를 재시도한다.  

### trigger 2  

`await wait()` 이 끝난후 `setCount((value) => value + 1);` 이 호출로 `useState`(`count`) hook 객체의 `queue.pending` 에 아래 update가 들어간다.   

```ts
{
  lane: 32,
  action: (value) => value + 1,
},
```


### rendering 3  

`renderLanes: 32` — trigger 2 의 `setCount` update(`DefaultLane`)로 시작된 렌더.  

> [!note]- 랜더링에 사용될 hook 객체 `fiber.memoizedState` 의 실제 값  
>  
> ```diff  
> {  
>   memoizedState: 1,  
>   baseState: 1,  
>   baseQueue: null,  
>   queue: {  
> +    pending: <ref *1> {  
> +      lane: 32,  
> +      revertLane: 0,  
> +      gesture: null,  
> +      action: [Function (anonymous)],  
> +      hasEagerState: false,  
> +      eagerState: null,  
> +      next: [Circular *1]  
> +    },  
>     lanes: 0,  
>     dispatch: [Function: bound dispatchSetState],  
>     lastRenderedReducer: [Function: basicStateReducer],  
>     lastRenderedState: 1  
>   },  
>   next: {  
>     memoizedState: 2,  
>     baseState: 1,  
>     baseQueue: <ref *2> {  
>       lane: 0,  
>       revertLane: 256,  
>       gesture: null,  
>       action: undefined,  
>       hasEagerState: false,  
>       eagerState: null,  
>       next: [Circular *2]  
>     },  
>     queue: {  
>       pending: null,  
>       lanes: 0,  
>       dispatch: [Function: bound dispatchOptimisticSetState],  
>       lastRenderedReducer: [Function (anonymous)],  
>       lastRenderedState: 2  
>     },  
>     next: null  
>   }  
> }  
> ```  


**판단 경로**  
- `useState`(`count`): `update.lane`(`32`) 포함 O → `revertLane` 없음 → 앞서 보존한 update 없음 → [[#결과 노드 표]] **③번**  
- `useOptimistic`: `baseQueue` update 의 `lane` 이 `NoLane` → `revertLane`(`256`) 미포함 → [[#결과 노드 표]] **⑤번**  

**처리**  
- `count`: update 를 반영해 `1 → 2` 가 되고, 재처리가 필요 없어 `baseQueue` 에서 제외된다.  
- `optimisticCount`: 갱신된 `baseState`(`2`) 위에 보존해 둔 optimistic update 가 다시 반영되어 `3` 이 되고 `baseQueue` 에 보존된다.  

즉 서버 반영값(2)과 아직 살아 있는 optimistic 효과(+1)가 겹쳐 화면에 `3`이 잠깐 표시된다.  

### commit 2  
```tsx
<button>Add 1</button>
<p>count: 2</p>
<p>optimisticCount: 3</p>
```
### rendering 4  

`renderLanes: 256`(`revertLane`) — Action 이 끝나 optimistic 을 되돌리는 렌더.  

> [!note]- 랜더링에 사용될 hook 객체 `fiber.memoizedState` 의 실제 값  
>  
> ```ts  
> {  
>   memoizedState: 2,  
>   baseState: 2,  
>   baseQueue: null,  
>   queue: {  
>     pending: null,  
>     lanes: 0,  
>     dispatch: [Function: bound dispatchSetState],  
>     lastRenderedReducer: [Function: basicStateReducer],  
>     lastRenderedState: 2  
>   },  
>   next: {  
>     memoizedState: 3,  
>     baseState: 2,  
>     baseQueue: <ref *1> {  
>       lane: 0,  
>       revertLane: 256,  
>       gesture: null,  
>       action: undefined,  
>       hasEagerState: false,  
>       eagerState: null,  
>       next: [Circular *1]  
>     },  
>     queue: {  
>       pending: null,  
>       lanes: 0,  
>       dispatch: [Function: bound dispatchOptimisticSetState],  
>       lastRenderedReducer: [Function (anonymous)],  
>       lastRenderedState: 3  
>     },  
>     next: null  
>   }  
> }  
> ```  

**판단 경로**  
- `useOptimistic`: `baseQueue` update 의 `lane` 이 `NoLane` → `revertLane`(`256`) 포함 → [[#결과 노드 표]] **④번**  

**처리**  
- 반영하지 않음: `baseQueue` 에 있는 update 를 반영하지 않으므로 `memoizedState` 는 `baseState`(`2`) 가 된다.  
- 제외: `baseQueue` 에서 제거  

### commit 3  
```tsx
<button>Add 1</button>
<p>count: 2</p>
<p>optimisticCount: 2</p>
```
## 결과  

이 예제에서 화면의 optimistic 값은 **1 → 2 → 3 → 2** 순으로 바뀌며, 최종적으로 `2`로 변한다.  

## 참고 자료  

- [React 공식 문서: Render and Commit](https://react.dev/learn/render-and-commit)  
- [React 공식 문서: Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)  
- [React 소스: ReactFiberHooks.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js)  
- [React 소스: ReactFiberConcurrentUpdates.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js)  
- [React 소스: ReactFiberWorkLoop.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js)  

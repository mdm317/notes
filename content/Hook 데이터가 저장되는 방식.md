
inside ReactFiberHooks.js
HooksDispatcherOnMount => useState => mountState => mountStateImpl => mountWorkInProgressHook
```ts

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

```
mountWorkInProgressHook 가 호출되면 
현재 fiber 의 memoizedState 에 훅은 연결리스트로 연결

예를 들어 
```ts

const Comp = ()=>{
	useState(1)
	useState(2)
	useState(3)
	return <></>
}

```
이런 컴포넌트가 있다면  Comp 의 fiber 의 memoizedState 데이터는 아래와 같다
```ts

 {
	  memoizedState: 1,
	  baseState: 1,
	  baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: [Function: bound dispatchSetState],
        lastRenderedReducer: [Function: basicStateReducer],
        lastRenderedState: 1
      },
      next: {
        memoizedState: 2,
        baseState: 2,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: [Function: bound dispatchSetState],
          lastRenderedReducer: [Function: basicStateReducer],
          lastRenderedState: 2
        },
        next: {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        }
      }
    }

```


### dispatch 업데이트 

❗️랜더중에 업데이트는 로직이 다름
dispatchSetState => dispatchSetStateInternal => enqueueConcurrentHookUpdate => enqueueUpdate
```ts

function enqueueUpdate(
  fiber: Fiber,
  queue: ConcurrentQueue | null,
  update: ConcurrentUpdate | null,
  lane: Lane,
) {
  // Don't update the `childLanes` on the return path yet. If we already in
  // the middle of rendering, wait until after it has completed.
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
	...
}

```
일단 concurrentQueues 에 저장 
저장된 값들은 finishQueueingConcurrentUpdates 에서 
```ts nums

export function finishQueueingConcurrentUpdates(): void {
	...
	const pending = queue.pending;
    if (pending === null) {
	    // This is the first update. Create a circular list.
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
      queue.pending = update;
	...
}

```

queue.pending = update; (12) 에 circular linked list 로 저장됨
9,10 에서 linked List 로 
1 이 순서대로 업데이트 되었다면 queue.pending => 1(circular)
1,2,3 이 순서대로 업데이트 되었다면 queue.pending => 3,1,2
1,2,3, 4 이 순서대로 업데이트 되었다면 queue.pending => 4,1,2
이런 circular 식으로 저장
??
일반 Linked List:  head → A → B → C → null
                   ↑ 추적

Circular (tail):   ┌─────────────────┐
                   ↓                 │
                   A → B → C ────────┘
                           ↑ pending(tail)
renderWithHooks 에서 HooksDispatcherOnUpdate 로 갈아끼워짐
```ts

    ReactSharedInternals.H =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

```

HooksDispatcherOnUpdate => useState => updateState => updateReducer => updateReducerImpl


updateReducerImpl 여기서부터 시작
```ts

  let baseQueue = hook.baseQueue;

  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    if (__DEV__) {
      if (current.baseQueue !== baseQueue) {
        // Internal invariant that should never happen, but feasibly could in
        // the future if we implement resuming, or some form of that.
        console.error(
          'Internal error: Expected work-in-progress queue to be a clone. ' +
            'This is a bug in React.',
        );
      }
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

```
hook 객체의 queue 의 pending 안에있던 데이터를 baseQueue에 옮김


```ts

const first = baseQueue.next;

```
next 로 한번 접근함으로써 first 에는 4 -> 1 -> 2 -> 3 에서 1 -> 2 -> 3 -> 4 로 변경

```ts nums

do{
	let shouldSkipUpdate = isHiddenUpdate
		? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
		: !isSubsetOfLanes(renderLanes, updateLane);
	if (shouldSkipUpdate) {
	   ...some code
	}else{
		if (update.hasEagerState) {
			newState = ((update.eagerState: any): S);
	    } else {
			newState = reducer(newState, action);
		}
	}

} while (update !== null && update !== first);

```
7줄에서 우선순위가 낮은 업데이트는 newBaseQueueLast 에 저장해서 보존
eagerState 는 dispatchSetStateInternal 안에서 queue 가 비어있을때 설정된다.

```ts

    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      ...
        update.hasEagerState = true;
        update.eagerState = eagerState;
    }

```
순서대로 업데이트
reducer 는 updateState => basicStateReducer 는 밑과 같음
```ts

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
```



HooksDispatcherOnMount
```ts
const HooksDispatcherOnMount: Dispatcher = {
  ...
  useState: mountState,
  useTransition: mountTransition,
  ...
}
```


mountState
```ts
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountStateImpl(initialState);
  const queue = hook.queue;
  const dispatch: Dispatch<BasicStateAction<S>> = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any);
  queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}

```
mountTransition
```ts nums{6, 15}

function mountTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void,
] {
  const stateHook = mountStateImpl((false: Thenable<boolean> | boolean));
  // The `start` method never changes.
  const start = startTransition.bind(
    null,
    currentlyRenderingFiber,
    stateHook.queue,
    true,
    false,
  );
  const hook = mountWorkInProgressHook();
  hook.memoizedState = start;
  return [false, start];
}

```

6, 15줄에서 workInProgressHook 에 훅 추가

startTransition 실행시 
```ts nums {4,5, 8}

function startTransition<S>(){
	...
	ReactSharedInternals.T = currentTransition;
	dispatchOptimisticSetState(fiber, false, queue, pendingState);
	...
	try {
		const returnValue = callback();
		...
	}
}

```
5줄에서 에서 sync 레인으로 isPending 을 true 바꾸는 업데이트 큐에 추가
8에서 callback 실행 만약 setState set-function 이 있다면 8에서 실행 
>[[setState 호출시 랜더링 함수까지의 흐름]]

4를 실행함으로써 callback 에서 일어나는 set-funtion 은 transtion 이벤트임을 확인
```ts nums{ 8}

function dispatchSetState<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
){
	...
	const lane = requestUpdateLane(fiber);
}

```
8에서 Transition lane 이 반환
requestUpdateLane => requestCurrentTransition 
```ts

export function requestCurrentTransition(): Transition | null {
  return ReactSharedInternals.T;
}

```
dispatchSetStateInternal => enqueueConcurrentHookUpdate => enqueueUpdate
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
concurrentQueues 에 데이터 저장
저장된 값들은 finishQueueingConcurrentUpdates 에서 
```ts

export function finishQueueingConcurrentUpdates(): void {
	...
	queue.pending = update;
	...
}

```

queue.pending = update; 에 circular linked list 로 저장됨


1. sync render
scheduleTaskForRootDuringMicrotask 에서 
```ts nums 
function scheduleTaskForRootDuringMicrotask(
  root: FiberRoot,
  currentTime: number,
): Lane {
	...
	if (
	    includesSyncLane(nextLanes) &&
	    // If we're prerendering, then we should use the concurrent work loop
	    // even if the lanes are synchronous, so that prerendering never blocks
	    // the main thread.
	    !checkIfRootIsPrerendering(root, nextLanes)
	  ) {
	    // Synchronous work is always flushed at the end of the microtask, so we
	    // don't need to schedule an additional task.
	    if (existingCallbackNode !== null) {
	      cancelCallback(existingCallbackNode);
	    }
	    root.callbackPriority = SyncLane;
	    root.callbackNode = null;
	    return SyncLane;
	} 
	
}


```
7 줄에서 sync lane 이 있으면 sync lane 을 반환해서 동기 랜더링 시작

processRootScheduleInMicrotask =>  flushSyncWorkAcrossRoots_impl => performSyncWorkOnRoot => performWorkOnRoot

### 랜더링 페이즈

HooksDispatcherOnUpdate => useState=>updateState => updateReducer => updateReducerImpl

```ts
function updateReducerImpl<S, A>(
  hook: Hook,
  current: Hook,
  reducer: (S, A) => S,
){
	...
	let shouldSkipUpdate = isHiddenUpdate
        ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
        : !isSubsetOfLanes(renderLanes, updateLane);
    ...
}


```

isSubsetOfLanes 에서 transition 업데이트는 skip

renderLanes 설정
 

processRootScheduleInMicrotask
```ts

function processRootScheduleInMicrotask() {
	...
	else if (enableDefaultTransitionIndicator) {
      syncTransitionLanes = DefaultLane;
    }
    ...
	if (!hasPendingCommitEffects()) {
		flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
	}
	...
    
}

```
processRootScheduleInMicrotask => flushSyncWorkAcrossRoots_impl=> getNextLanesToFlushSync => performSyncWorkOnRoot => performWorkOnRoot => renderRootSync => workLoopSync => performUnitOfWork => beginWork => updateFunctionComponent => renderWithHooks => renderLanes = nextRenderLanes;
만약 큐에 sync 와 default 가 같이 있으면 
nextLanes 가 34 로 설정 sync & DefaultLane
그외의 경우는 2 sync lane 으로 설정



updateReducer 에서 renderRanes 업데이트만 업데이트
큐에 섞여 있으면????

hook 구조
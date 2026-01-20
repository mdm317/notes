### mount

HooksDispatcherOnMount
```ts
const HooksDispatcherOnMount: Dispatcher = {
  ...
  useState: mountState,
  useTransition: mountTransition,
  ...
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

6, 15줄에서 fiber 에 훅 객체 추가 
> [[useState 동작#마운트]]

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
> requestCurrentTransition 에서 호출

8에서 callback 실행 만약 setState set-function 이 있다면 8에서 실행 


4를 실행함으로써 callback(line 8) 에서 일어나는 set-funtion 은 transtion 이벤트임을 확인

callback 에 setState 함수가 있었다고 가정하고 실행되면 dispatchSetState 가 실행
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
>  [[useState 동작#dispatch 업데이트]]

## rendering

`dispatchOptimisticSetState` 실행으로 sync render가 한 번,  
callback을 통한 concurrent render가 한 번 발생하여 총 두 번 렌더링이 실행됨

HooksDispatcherOnUpdate => useState=>updateState => updateReducer => updateReducerImpl

> [[useState 동작#updateReducerImpl]]


### 1. sync render

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

processRootScheduleInMicrotask => flushSyncWorkAcrossRoots_impl=> getNextLanesToFlushSync => performSyncWorkOnRoot => performWorkOnRoot => renderRootSync => workLoopSync => performUnitOfWork => beginWork => updateFunctionComponent => renderWithHooks => renderLanes = nextRenderLanes;

### 2. concurrent render

callback 에 setState 가 있었다고 가정

HooksDispatcherOnUpdate => useState=>updateState => updateReducer => updateReducerImpl

### sync lane


```ts

export const SyncUpdateLanes: Lane =
  SyncLane | InputContinuousLane | DefaultLane;

```
SyncUpdateLanes 은 위의 3개 Lane 을 포함

```ts

    function App() {
      const [counter, setCounter] = useState(1);
      const [isPending, startTransition] = useTransition()

      return (
        <>
        {isPending && <Text text={'l'}/>}
          <Text text={'A' + counter} />
        </>
      );
    }

```
위의 컴포넌트를
밑의 코드로 실행했을때 
```ts

  startTransition(() => {
	setCounter(3);
	return 'end'
  });
  setCounter(2);

```

`isPending`을 `true`로 바꾸는 **SyncLane<2> 업데이트**와  
`setCounter(2)`로 인한 **DefaultLane 업데이트**가 동시에 처리되어  
✅ `lA2` => `A3`
이렇게 변경됨
❌ `lA` => `lA2` => `A3`






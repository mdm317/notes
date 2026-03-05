> [!important]
> 리액트 19.2 기준

### 종류
- eager
- ealry
- lazy?
#### eager

리렌더링을 스케줄링하지 않음
- setState 를 같은 값으로 호출 할때 

inside dispatchSetStateInternal
```ts

if (is(eagerState, currentState)) {
	enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update);
	return false;
}

```

#### early

스케줄링은 됬지만 랜더링 전에 bailout
```ts

attemptEarlyBailoutIfNoScheduledUpdate

```

#### lazy?
공식 명칭인지는 모르겠지만 react code 내에서 이렇게 쓰인 적이 있음
같은 상태로 업데이트 되지만 큐가 비었는지를 확신하지 못해서 랜더링까지는 진행후 bail out

>// Update to the same state. React doesn't know if the queue is empty
>// because the alternate fiber has pending update priority, so we have to
>// enter the render phase before we can bail out. But we bail out before
>// rendering the child, and we don't fire any effects.

랜더링은 되지만 effect 는 실행되지 않음


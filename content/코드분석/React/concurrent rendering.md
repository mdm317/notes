
> [!important]
> 리액트 19.2 기준

v19 의 리액트의 랜더링에는 두가지 모드가 존재
 - sync rendering
 - concurrent rendering

[[setState 호출시 랜더링 함수까지의 흐름]]


### sync rendering 
renderRootSync => workLoopSync 
```Typescript {'title':'workLoopSync.ts'}
function workLoopSync() {
  // Perform work without checking if we need to yield between fiber.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

도중에 멈출수 없음
### concurrent rendering

renderRootConcurrent => workLoopConcurrent
```Typescript {'title':'workLoopConcurrent.ts'}
function workLoopConcurrent(nonIdle: boolean) {
  if (workInProgress !== null) {
    const yieldAfter = now() + (nonIdle ? 25 : 5);
    do {
      performUnitOfWork(workInProgress);
    } while (workInProgress !== null && now() < yieldAfter);
  }
}
```
중간에 업데이트를 멈출수 있는 로직이 있음

### 주의점
결국엔 fiber 단위로 랜더링을 멈출 수 있음 
 - fiber 단위를 잘게 잘 쪼개야함 
 - 하나의 컴포넌트가 랜더링이 오래걸린다면 concurrent rendering 이 의미가 없음 
	 - https://github.com/reactwg/react-18/discussions/41#discussioncomment-841116

```Typescript
const PostsTab = memo(function PostsTab() {
  // 한 번 로깅합니다. 실제 속도 저하는 SlowPost 컴포넌트 내부에 있습니다.
  console.log('[ARTIFICIALLY SLOW] Rendering 500 <SlowPost />');

  let items = [];
  for (let i = 0; i < 500; i++) {
    items.push(<SlowPost key={i} index={i} />);
  }
  return (
    <ul className="items">
      {items}
    </ul>
  );
});
```
공식 예제에서도 fiber 를 잘게 쪼갠 예로 보여주고 있음
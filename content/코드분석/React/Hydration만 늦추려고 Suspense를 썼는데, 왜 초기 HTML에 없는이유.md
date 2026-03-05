
> [!important]
> 리액트 19.2 기준

### 원하는 컴포넌트

클라이언트 컴포넌트
- 렌더링 비용이 크고
- 사용자가 바로 상호작용하지는 않지만
- 그래도 첫 화면에는 보였으면 좋다

이럴 때 가장 먼저 떠올릴 수 있는 방법은 보통 이런 식이다.

```ts

<Suspense>
	<Com>
</Suspense>

```

겉보기에는 `Suspense`로 감쌌고, `Com`이 throw 를 하지 않는 경우 첫 HTML에 포함될 것처럼 보인다.

그런데 React 19.2에서는 항상 그렇지 않음

---

### 왜냐하면 `Suspense` 경계 내부가 첫 HTML에 바로 인라인되지 않을 수 있기 때문이다

React 서버 렌더러는 `SuspenseBoundary`를 보고,  
이 경계를 **현재 HTML에 바로 포함할지(inline)** 아니면 **뒤로 미룰지(outline)** 결정한다.

만약 outline 대상으로 판단되면:

- 실제 `Suspense` 내부 콘텐츠는 바로 HTML에 실리지 않고
    
- 대신 `fallback`이 먼저 렌더링된다
    
- 내부 콘텐츠는  hidden 형태로 포함된다.


즉, **`Suspense`로 감쌌다고 해서 무조건 첫 HTML에서 보여지는건 아니다.**

---

### 관련 코드

`ReactFizzServer.js`의 `flushSegment`를 보면 이런 조건이 있다.

```ts {5,6}
// flushSegment
if (
    !flushingPartialBoundaries &&
    isEligibleForOutlining(request, boundary) &&
    (flushedByteSize + boundary.byteSize > request.progressiveChunkSize ||
      hasSuspenseyContent(boundary.contentState) ||
      boundary.defer)
  ){
	 // Inlining this boundary would make the current sequence being written too large
  }

```

그리고 `isEligibleForOutlining`은 이렇게 생겼다.
```ts

function isEligibleForOutlining(
  request: Request,
  boundary: SuspenseBoundary,
): boolean {
  return (
    (boundary.byteSize > 500 ||
      hasSuspenseyContent(boundary.contentState) ||
      boundary.defer) &&
    boundary.preamble === null
  );
}

```

핵심은 `SuspenseBoundary`가 지금 인라인하면 너무 커지는지를 판단한다.

#### 1) outline 후보인지 확인

아래 조건 중 하나라도 만족하면 outline 후보가 된다.
1. `boundary.byteSize > 500`
2. `hasSuspenseyContent(boundary.contentState)`
3. `boundary.defer`

(2) => 위의 요구사항에서는 해당안됨
(3) => 기본이 false

outline 후보는 위의 요구사항시에는 (1)에서 bytesize > 500 이면 후보로 설정된다.

---

#### 2) 지금 HTML에 넣기엔 부담이 큰지 확인

다음 조건 중 하나라도 만족하면 React는 이 경계를 바로 인라인하지 않을 수 있다.

1. `flushedByteSize + boundary.byteSize > request.progressiveChunkSize`
2. `hasSuspenseyContent(boundary.contentState)`
3. `boundary.defer`

2,3 은 중복이고 여기서 중요한 값은 두 가지다.

- `flushedByteSize`: 현재 세그먼트에서 이미 출력된 HTML 크기
	- suspenseboundary 를 제외한 다른 html 크기값
- `request.progressiveChunkSize`: 청크 크기 기준값
	- 기본값 `12800`



즉, 현재까지 랜더링한 HTML + 이 boundary 크기가 `12800`을 넘으면  
React는 이 `Suspense` 경계를 첫 HTML에 넣지 않고 뒤로 미룸

React api 만 사용하면 `progressiveChunkSize` 를 조절 할 수 있지만 
next.js 를 사용하게 된다면 `progressiveChunkSize` 를 따로 조절하는 설정은 없다.

---

### 정리하면

`Suspense` 안의 컴포넌트를 첫 HTML에 꼭 포함시키고 싶다면,  
적어도 다음 요소들을 신경 써야 한다.

- `boundary.byteSize`가 너무 크지 않아야 하고
- 현재 세그먼트 전체 크기(`flushedByteSize + boundary.byteSize`)도 `progressiveChunkSize`를 넘지 않아야 한다.

두가지 조건중 하나는 반드시 충족해야 한다.

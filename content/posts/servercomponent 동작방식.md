
### Flight (react-server)  

> **Flight**는 [RSC](https://react.dev/reference/rsc/server-components)의 렌더링 결과를 직렬화·역직렬화하는 프로토콜이다.  

#### 실행 조건  

Node.js에서 Flight 서버 모듈을 사용하려면 `react-server` 조건을 활성화해야 한다.  
react, package.json 일부  
```json 

  "exports": {
    ".": {
      "react-server": "./react.react-server.js",
      "default": "./index.js"
    },

```

```bash
node --conditions react-server <실행 파일>
```
실행 메소드  
```ts

renderToPipeableStream(createElement(App), clientManifest)

```
#### Flight payload 예시  

```text nums
1:"$Sreact.suspense"
3:I["Counter", [], "default"]
0:["$", "html", null, ...]
2:["$", "p", null, {"children":"1초 걸려 가져온 데이터"}]
```

- `0`, `1`, `2`, `3`: 각 데이터 조각의 **chunk ID**  
- `I`: 클라이언트에서 불러올 모듈 정보  
- `$S`: `Symbol` 참조  
- `["$", ...]`: React Element 표현  

client component 처리  

client 컴포넌트를 reference 만 참조하게 하고. 진행하지 않음  
위의 예시의 두번째 줄에 해당  
client 컴포넌트안에서 server compoennet 를 import 할 수는 없음  
다만 prop으로는 전달 할 수 있음  

### Fizz   

실행 메소드는 같음  

```ts
renderToPipeableStream(createElement(App), clientManifest)
```

createElement(App) 을 prop 으로 넣어 줄 수도 있고   
위에서 생성한 flight 를 넣어서 만들 수 있음  

결과가 html 형식으로 나옴  

```html
 <main>
	<h1>안녕 Flight</h1>
	<!--$?--><template id="B:0"></template>
	<p>로딩중…</p>
	<!--/$-->
	<button>
	  클릭
	  <!-- -->0
	</button>
  </main>
```
코드 설명  
  - Suspense boundary: `<!--$?-->`부터 `<!--/$-->`까지  
  - 실제 fallback 콘텐츠: `<p>로딩중…</p>`  
  - template#B:0: React가 boundary를 찾기 위해 사용하는 숨겨진 기준점  

#### Suspense 콘텐츠가 도착한 이후의 동작  

완성된 콘텐츠는 화면에 바로 표시되지 않고 숨겨진 `S:0`으로 도착한다.  

```html
<div hidden id="S:0">
  <p>1초 걸려 가져온 데이터</p>
</div>
<script>
  // $RB, $RV, $RC 함수 정의
  $RC("B:0", "S:0")
</script>
```

##### `$RC`: 화면 교체 예약  

```js
$RC("B:0", "S:0")
```

- `B:0`과 `S:0`을 찾아 queue에 등록한다.  
- 시작 마커를 pending 상태인 `$?`에서 대기 상태인 `$~`로 변경한다.  
- 다음 frame 또는 timer에 `$RV` 실행을 예약한다.  

##### `$RV`: 실제 DOM 교체  

- 기존 `<template id="B:0">`과 fallback을 제거한다.  
- `S:0`의 자식을 그 자리에 삽입한다.  
- 시작 마커를 완료 상태인 `$`로 변경하고 hydration을 재시도한다.  

```html
<!-- 교체 전 -->
<!--$?--><template id="B:0"></template><p>로딩중…</p><!--/$-->

<!-- 교체 후 -->
<!--$--><p>1초 걸려 가져온 데이터</p><!--/$-->
```

### next.js 의 동작  

 - **서버:** Flight  → HTML  
 - **브라우저:** Flight → `createFromReadableStream` → React 트리  

브라우저 코드 예제  
```js
const payload = createFromReadableStream(someStream)
function Root() {
	return use(payload);
}
hydrateRoot(document.getElementById("root"), root);
```
hydrateRoot 에는 root 가 suspense 일시 hydrate 를 미루는 동작이 있음  



https://www.plasmic.app/blog/how-react-server-components-work#what-are-react-server-components  
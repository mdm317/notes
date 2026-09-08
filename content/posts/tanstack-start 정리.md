
### 기본 동작  

최초 접속 시에는 서버에서 HTML을 렌더링하는 SSR 방식으로 동작하고, 이후 페이지 이동은 클라이언트 라우팅을 통해 전체 새로고침 없이 SPA처럼 동작한다.  

### cache  

Next.js와 TanStack Start는 기본 캐시 적용 계층이 다르다.  
Next.js는 fetch 확장 옵션이나 'use cache'로 주로 서버에서 캐시하고  
Tanstack Start는 staleTime으로 주로 클라이언트에서 캐시한다.  

그렇기에 Tanstack start 에서 isr 을 적용하려면 cache header 을 이용해야함 [isr](https://tanstack.com/start/latest/docs/framework/react/guide/isr)  

Tanstack Start 는 client 단 캐쉬이기 때문에 새로고침이나 새로운 탭에서에서 로딩할시 staletime 이 동작하지 않음  
또한 인증이 필요한 페이지의 경우 cdn 에 저장되면 안되기때문에 클라이언트의 staletime 만 이용해서 cache 를 적용 해야함  

### with tanstack-query  

prefetch 를 쓰지 않는다면 일반 spa 처럼 쓰면 된다.  

#### with prefetch   

##### 장점  

- 미리 데이터를 요청해 waterfall 을 줄일수 있음  
- loader 에서 await 하지 않고 클라이언트에서 use(Suspense)Query 를 사용해서 client 에서 데이터를 await 할지말지 결정할 수 있음  
  - 하지만 pendingMs 는 loader 의 시간을 측정하기때문에 loader 에 awiat 을 적용하지 않으면 안쓰는게 나음  

##### 단점  
- query option 에 staletime 이 있기때문에 router 에도 staletime 을 선언하면 side effect 발생 가능  
- Com2에서 `query-a`를 제거했는데 loader prefetch 에서 `query-a` 남겨두면, loader가 실행될 때마다 불필요한 API 요청이 발생할 수 있다.  


출처  
- https://tanstack.com/start/latest/docs/framework/react/guide/execution-model  
- https://tanstack.com/router/latest/docs/guide/ssr  
- https://tanstack.com/router/latest/docs/integrations/query  
- https://tkdodo.eu/blog/tan-stack-router-and-query  
- https://tkdodo.eu/blog/reliable-query-prefetching-with-tanstack-router  

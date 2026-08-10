
## 서버데이터 처리
서버에서 가져온 데이터를 Client Component의 QueryCache와 연결하는 방법들

### initialData

initialData는 이미 가지고 있는 데이터를 query의 초기값으로 사용하는 방식이다.

~~~tsx
// Server Component
export default async function PostsPage() {
  const posts = await getPosts()

  return <Posts initialPosts={posts} />
}
~~~

~~~tsx
// Client Component
'use client'

function Posts({ initialPosts }) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: initialPosts,
  })

  return <PostList posts={data} />
}
~~~
#### 장점

- 구현이 단순하다.
- 별도의 dehydrate와 HydrationBoundary 없이 시작할 수 있다.

#### 단점
- 기존 클라이언트 캐시보다 최신이어도 갱신하지 않는다.
  - 예시: 사용자가 다른 화면으로 이동했다가 뒤로가기로 돌아왔을 때 QueryClient에 기존 캐시가 남아 있으면, 서버에서 새로 전달된 `initialData`가 있어도 기존 캐시가 계속 표시될 수 있다.
  - 원인: `initialData`는 해당 query의 캐시가 비어 있을 때만 사용된다.
- 서버 데이터의 갱신 시점을 정확히 전달하려면 initialDataUpdatedAt을 별도로 관리해야 한다.
  - initialDataUpdatedAt을 따로 전달하지 않으면 staleTime 관련 로직이 에러날 수 있다.
- propsdrilling

### prefetchQuery with HydrationBoundary

서버에서 query를 미리 실행하고, 결과를 dehydration한 뒤 클라이언트 QueryClient로 복원하는 방식이다.

~~~tsx
// Server Component
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import Posts from './posts'

export default async function PostsPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
~~~

~~~tsx
// Client Component
'use client'

function Posts() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    staleTime: 60_000,
  })

  return <PostList posts={data} />
}
~~~

- `dehydrate`는 RSC/Flight Payload를 만들거나 네트워크로 전송하지 않는다. 전송에 사용할 캐시 스냅샷을 만드는 단계다.
데이터 예시
  ~~~json
  {
    "mutations": [],
    "queries": [
      {
        "dehydratedAt": 1786233600000,
        "state": {
          "data": [
            {
              "id": 1,
              "title": "첫 번째 글"
            }
          ],
          "dataUpdateCount": 1,
          "dataUpdatedAt": 1786233600000,
          "error": null,
          "errorUpdateCount": 0,
          "errorUpdatedAt": 0,
          "fetchFailureCount": 0,
          "fetchFailureReason": null,
          "fetchMeta": null,
          "isInvalidated": false,
          "status": "success",
          "fetchStatus": "idle"
        },
        "queryKey": ["posts"],
        "queryHash": "[\"posts\"]"
      }
    ]
  }
  ~~~

- 복원된 데이터가 stale로 판단되면 `staleTime`과 refetch 설정에 따라 클라이언트에서 다시 요청할 수 있다.

#### initialData 보다 나은점

- 기존 클라이언트 캐시보다 최신이어도 갱신한다.
- `initialDataUpdatedAt` 별도 관리 필요 x
- props drilling 해결
#### 단점
- dehydrated data만큼 RSC/Flight Payload가 커진다.
- 서버 QueryClient 생성과 캐시 복원 비용이 추가된다.
- data ownership 문제 고려해야함

#### 장점
- 첫 화면에 필요한 데이터를 서버에서 미리 가져올 수 있어서 waterfall( js load => hydrate => api call)을 줄일 수 있다.


## 참고 자료

- [TanStack Query — Server Rendering & Hydration](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)
- [TanStack Query — Prefetching & Router Integration](https://tanstack.com/query/v5/docs/framework/react/guides/prefetching)
- [TanStack Query — Initial Query Data](https://tanstack.com/query/v5/docs/framework/react/guides/initial-query-data)
- [TanStack Query — Hydration API](https://tanstack.com/query/v5/docs/framework/react/reference/hydration)
- [TanStack Query — QueryClient](https://tanstack.com/query/v5/docs/reference/QueryClient)
- [Next.js — Caching and Revalidating](https://nextjs.org/docs/app/guides/caching-without-cache-components)
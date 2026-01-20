
```typescript
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
  TState = QueryObserverResult<TData, TError>,
> = BaseQueryNarrowing<TData, TError> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>
```

`OmitKeyof` 를 하게 되면 union 타입도 object 타입으로 변한다. 

원인은 두가지
 - omitkeyof 로 object 형태로 type predicate 수행 
 - type predicate 가 실패
	 - 그 결과로 기존타입과 `type predicate` 타입이 이 Intersection 으로 합쳐진 상태
		 - cc. [[type-predicates#type is not assignable to narrowType]]


해결법
object타입형태로 type predicate 를 동작하게 하되  `this is narrowType`
`type` 이 `narrowType` 에 할당 가능하게 수정

https://github.com/TanStack/query/pull/9653
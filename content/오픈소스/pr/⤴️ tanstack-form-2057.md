https://github.com/TanStack/form/pull/2057


```ts {2, 4-5}

type Test = never extends string ? "yes" : "no"  // never
//   ^? yes
type Dist<T> = T extends string ? "yes" : "no"
type Test2 = Dist<never>  // never
//   ^? never

```

`never` 는 `empty union` 이고  empty union 을 distribute 하면 never 가 나옴
(2) 는 distribute 하지 않음
(4) 는 distribute

ts 에 이미 work as intended label 로 올라와 있음
https://github.com/microsoft/TypeScript/issues/31751
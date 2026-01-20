distribute 하지 않아서 생김

```ts
type IsString<T> = T & string extends never ? false : true
```
이런 ts 함수가 있을때 T 가 union 일때는 의도한대로 동작하지 않음

```ts

type R = IsString<string | number> // true
type R1 = IsString<string> // true
type R2 = IsString<number> // false

```

conditional 타입을 추가해서 강제로 distribute 하게 수정
cc. [[conditional type#Distributive conditional types]]

https://github.com/TanStack/router/pull/5536
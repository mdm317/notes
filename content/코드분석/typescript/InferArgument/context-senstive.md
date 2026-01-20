---

---
관련 이슈 

[https://github.com/microsoft/TypeScript/issues/47599](https://github.com/microsoft/TypeScript/issues/47599)

ex

```typescript
declare function f<A, B>(arg: {
  produce: () => A;
  consume: (a: A) => B;
  callback: (b: B) => void;
}): void;

f({
  callback: (b) => {
    console.log(b);
  },
  produce: () => "hello",
  consume: (a) => a.length,
});
```

### 동작방식

inferTypeArguments 를 두번 호출

첫번째에  `produce: () => "hello",` 를 이용해서 `A `의 candidate 에 `string` 을 추가 

두번째 시도에` consume: (a) => a.length,` 를 이용해 `B`  의 candidtae 에 `number` 를 추가 

### 주의점 

typeParameter 를 object 로 추론하고 그 Object 의 value 값을 이용해서 타입을 만드려면 잘 안됨.

또 같은 예로 배열 타입을 infer 하려고 할때 동작이 잘 안될 수 있음 

** reverse mapped types과 관련있음**

```typescript
declare function f<T>(
  arg: {
    [K in keyof T]: {
      produce: (n: string) => T[K];
      consume: (x: T[K]) => void;
    };
  }
): void;
```

관련이슈  https://github.com/microsoft/TypeScript/issues/53018 

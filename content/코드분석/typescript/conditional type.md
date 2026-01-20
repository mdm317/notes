---

---
### Distributive conditional types

When conditional types act on a generic type, they become _distributive_ when given a union type. For example, take the following:

https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types

## infer
### 예제1
arg 에 conditional type 이 있을때

```typescript
declare function t<T>(arg: T extends string ? string : number):any
t(4) 
t("123") //error5
```

 위와 같은 function 이 있다고 했을때 arg 를 `infer` 할때는 T 가 무엇인지 몰라서 extends(`extendsType`) 를 체크할수 없다

`inferToConditionalType` 를 호출

```typescript
 // inside inferToConditionalType
const targetTypes = [getTrueTypeFromConditionalType(target), getFalseTypeFromConditionalType(target)];
inferToMultipleTypesWithPriority(source, targetTypes, target.flags, contravariant ? InferencePriority.ContravariantConditional : 0);
```

TrueType `string`, FalseType `number` 를 `target` 으로 `infertypes` 를 호출해서 candidate 를 검사한다.

``infertypes`` 는 typeParameter 가 없으면 아무동작도 하지 않는다.
>cc. [[inferTypeArguments 기본동작]]

contional type 에서 infer 가 실패(candidate 가 없으면 ) FalseType 으로 infer 된다.
즉 위의 코드에서 arg 의 뭘입력하든 number 로 infer 된다.
### 예제2

```typescript
declare function t<T>(arg: T extends string ? T : never):any
```

만약 이런 함수라면 Context (`T`) 가 같기때문에 `T`  에 `sourceType` 을 추가한다.

원하는대로 T 가 string 일때만 arg 가 `T` 타입이고 나머지 타입은 `never` 이다

```typescript
declare function t:<T>(arg: T extends { a : infer B } ? B : C):any
```

infer 로 만든 제너릭일 경우에는  Context (`T`) 가 다르기 때문에 T나 , B 에 아무 candidtate 도 추가되지 않는다.

예1, 예2 로 확인해보면 candidate 가 없는데 infer 를 쓰면 안된다.

### 예제 3

```typescript
export type Constrain<T, TConstraint, TDefault = TConstraint> =
  | (T extends TConstraint ? T : never)
  | TDefault
```

출처  https://github.com/TanStack/router 

이런식으로 ` (T extends TConstraint ? T : never)` 를 이용해서 T 에 object 를 넣고 

TDefault 에는 infer 를 넣어서 Object 에서 타입을 뽑아내서 쓸수도 있다.

그러나 context-sensitive 에는 여전히 문제가 생김


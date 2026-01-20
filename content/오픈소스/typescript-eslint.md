---

---
### **not merge**

:FasCodeMerge: ❌  [pr-10744](https://github.com/typescript-eslint/typescript-eslint/pull/10744 )

typescript 의 `**isTypeAssignableTo**`** 를 사용
구현하면 새로운 에러케이스 생기고 수정하면 또 생기고 반복이라 엄청 오래걸리고 비효율적으로 구현했다.
다음에 이런 경우가 있다면 처음부터 어떤 에러케이스들 있는지 확실히 파악하고 시작해야 겠다고 생각했다.
개인적으로는 merge 가 힘들것 같다 .Union 에서 재귀로 모든 Property 를 비교하는데 규모가 큰 라이브러리에서 성능문제가 생길것 같다.

다른 typescript api 를 기다리거나 기능을 축소하는게 좋아보인다.

❌ reverted 
isTypeAssignableTo 의 side effect 가 너무 많았음
개인적으로 interface 와 type 일때 isTypeAssignableTo 가 다르게 동작하는걸 처리하는게 가능할까 모르겠음
또한 Record 랑 {} 도 처리가 아려워 보임

### **merge**

:FasCodeMerge:  [pr-11533](https://github.com/typescript-eslint/typescript-eslint/pull/11533)

TypeScript를 사용하더라도 엄격한 타입 체크를 하지 않는 개발자들이 있다는 것을 알게 되었다. 특히 레거시 코드베이스에서는 이런 경우가 종종 있는 것 같다.  

예를 들어, 다음과 같이 foo가 절대 null이나 undefined가 될 수 없는 타입임에도 불구하고, 런타임 방어 코드처럼 foo && foo.bar 형태로 접근하는 패턴을 볼 수 있다.
```ts
const foo: { bar:4 } = { bar:4 }
foo && foo.bar
```
이런식으로 foo 에 null 을 안쓰고도 사용하는 사람들이 있었다.

:FasCodeMerge:  [pr-10019]([https://github.com/typescript-eslint/typescript-eslint/pull/10019])

버튼이 코드 텍스트와 겹치는 문제가 있었다.
처음에는 무조건 padding을 추가해 버튼을 아래로 내렸는데, 한 줄짜리 코드에도 적용돼 버튼 위치가 어색해 보였다.
그래서 maintainer가 제안한 대로, 글자 수가 일정 이상일 때만 버튼을 내리도록 휴리스틱을 적용해 수정했다.

:FasCodeMerge: [pr-10374](https://github.com/typescript-eslint/typescript-eslint/pull/10374)

React Testing Library나 E2E 테스트만 해오다가, 이번에 처음으로 코드 커버리지 테스트를 해봤는데 생각보다 쉽게 적용되진 않았다.  
특히, assert가 반드시 필요한 경우가 있었다.

:FasCodeMerge: [pr-10523](https://github.com/typescript-eslint/typescript-eslint/pull/10523)

고쳤지만 다른 에러를 유발했다 (못 고쳤다.)

타입스크립트의 widening and narrowing 이 어떻게 동작하는지 자세하게 알 수 있었다.

[pr-widening-narrowing-article](https://shively-sanders.com/manual/Widening-and-Narrowing-in-Typescript.html)

:FasCodeMerge: [pr-11198](https://github.com/typescript-eslint/typescript-eslint/pull/11198)

:FasCodeMerge: [pr-11350](https://github.com/typescript-eslint/typescript-eslint/pull/11350)

lint 화면에서 Types 이 제대로 안나오는 문제였다.

대체 왜 안되는지 궁금해서 오기로 수정했다.  
많은 정보가 없어서 검색을 거의 못하고 코드를 하나하나 보면서 찾았다.  
중간에 3번정도 포기할라 그랬는데 그동안 이유를 찾느라고 쓴 시간이 아까워서 계속 구현한 케이스

하지만 다른 에러를 발생시켜 버렸다.(11350)  
이 때 보니까 왜 이런코드를 만들었는지 모를정도로 이상한 코드였다.  
별개로 내가 쓴 글을 다른 분이 수정해주셨다. 영어를 좀 공부해야 겠다.

:FasCodeMerge: [pr-10069](https://github.com/typescript-eslint/typescript-eslint/pull/10069)

:FasCodeMerge: [pr-10678](https://github.com/typescript-eslint/typescript-eslint/pull/10678)

:FasCodeMerge: [pr-10701](https://github.com/typescript-eslint/typescript-eslint/pull/10701)

간단한 로직 수정






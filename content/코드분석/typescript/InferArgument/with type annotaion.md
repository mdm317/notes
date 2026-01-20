---

---
```typescript
type P<T> = M<T>
const t: P<T> = somevalue
f(t)
```

## Generic type

```typescript
if (
  getObjectFlags(source) & ObjectFlags.Reference && getObjectFlags(target) & ObjectFlags.Reference && 
  && somecondition) {
  // If source and target are references to the same generic type, infer from type arguments
  inferFromTypeArguments(getTypeArguments(source as TypeReference), getTypeArguments(target as TypeReference), getVariances((source as TypeReference).target));
}
```

주석글 처럼 같은 제네릭이면 argument 만 비교한다. 
보통 infer 는 `sourcetype` 이 제네릭이 아니므로

가장 마지막 else 에 있는 `*inferFromObjectTypes*`* 를 호출해서 비교한다.*

```typescript
//inside inferFromObjectTypes
inferFromProperties(source, target);
inferFromSignatures(source, target, SignatureKind.Call);
inferFromSignatures(source, target, SignatureKind.Construct);
inferFromIndexTypes(source, target);
```

가장 기본예제로 arg 에 object 가 주어지면 위 함수들에서 infer 된다.

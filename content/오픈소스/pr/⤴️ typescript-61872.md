[https://github.com/microsoft/TypeScript/issues/61743](https://github.com/microsoft/TypeScript/issues/61743)
https://github.com/microsoft/TypeScript/pull/61872

밑의 코드에서 T1, T2 의 타입이 달라서 생기는 이슈였다.

```typescript
declare class X {
	private a: number;
	b: string;
}
type Y = { a: number } & { b: string };
type Z = Pick<{ a: number }, 'a'> & { b: string };
type T1 = X & Y // T1 is never
type T2 = X & Z // but T2 is not never
```

property 가 private 인지 확인하는 함수
`*getReducedType` ⇒ `isNeverReducedProperty` ⇒ `isConflictingPrivateProperty`*

```typescript
function isConflictingPrivateProperty(prop: Symbol) {
  // Return true for a synthetic property with multiple declarations, at least one of which is private.
  return (
    !prop.valueDeclaration &&
    !!(getCheckFlags(prop) & CheckFlags.ContainsPrivate)
  );
}

```

```typescript
declare class X {
  private a: number;

}
type C = Pick<{ a: 1 }, 'a'> & X;

```

위의 예제는 `C`의 property 의 `a` 에 valueDeclaration 이 있어서 `isConflictingPrivateProperty` 의 결과가 무조건 `false` 로 나온다.

## valueDeclaration

[https://github.com/microsoft/TypeScript/pull/61346#discussion_r1980147888](https://github.com/microsoft/TypeScript/pull/61346#discussion_r1980147888)

Andarist 이분이 단 댓글중에 valueDeclaration 를 설명하는 댓글이 있다.

> .valueDeclaration is only set on union/intersection properties when it's "uniform"(ish).

intersection이랑 union 이고 property 를 비교할때 두 property 의 valuedeclation 이 같을 경우에 valueDeclaration intersection/union 의 property 에 설정되야 한다.

intersection/union 의 property 를 설정하는 코드는 `createUnionOrIntersectionProperty` 이 함수에 있다.
그중에서도 firstValueDeclaration 를 설정하는 코드만 일부 뽑아왔다.

```plain text
let hasNonUniformValueDeclaration = false;
for (const prop of props) {
  if (!firstValueDeclaration) {
    firstValueDeclaration = prop.valueDeclaration;
  } else if (
    prop.valueDeclaration &&
    prop.valueDeclaration !== firstValueDeclaration
  ) {
    hasNonUniformValueDeclaration = true;
  }
}

```

이코드를 이해하기 위해 구현되었던 [pr](https://github.com/microsoft/TypeScript/pull/23190) 과  [이슈](https://github.com/microsoft/TypeScript/issues/22845)를 찾았다.

*intersection/union property 를 만들때 두 심볼을 비교할때 한 쪽이 valueDeclaration이 있고 한쪽이 valueDeclaration 없을때에도 uniform 하다고 설정되고 있었다.*

위의 `isConflictingPrivateProperty` 로직은 unifrom 하지않고 property 가 private 일때만 conflict 하다고 판단한다.

symbol 의 valueDeclaration이 undefined 일때는 intersection/union property 의 valueDeclaration을 설정 안하도록 하는 pr 을 올려보았다.

[https://github.com/microsoft/TypeScript/pull/61872](https://github.com/microsoft/TypeScript/pull/61872)
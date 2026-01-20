---

---
타입가드로 알고있었는데 공식문서에서도 type precates 라고한다.
https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
## 동작


```typescript
type typePredicate = (type: Type) => type is NarrowType;
```

저런 타입함수가 실행되었을때 Type 의 종류에 따라 동작이 다르다.

**getNarrowedTypeWorker**

```typescript
function getNarrowedTypeWorker(...){
...
const narrowedType = mapType(candidate, c => {
	// If a discriminant property is available, use that to reduce the type.
	const discriminant = keyPropertyName && getTypeOfPropertyOfType(c, keyPropertyName);
	const matching = discriminant && getConstituentTypeForKeyType(type as UnionType, discriminant);
	// For each constituent t in the current type, if t and and c are directly related, pick the most
	// specific of the two. When t and c are related in both directions, we prefer c for type predicates
	// because that is the asserted type, but t for `instanceof` because generics aren't reflected in
	// prototype object types.
	const directlyRelated = mapType(
		matching || type,
		checkDerived ?
			t => isTypeDerivedFrom(t, c) ? t : isTypeDerivedFrom(c, t) ? c : neverType :
			t => isTypeStrictSubtypeOf(t, c) ? t : isTypeStrictSubtypeOf(c, t) ? c : isTypeSubtypeOf(t, c) ? t : isTypeSubtypeOf(c, t) ? c : neverType,
  );
...
// 1
return !(narrowedType.flags & TypeFlags.Never) ? narrowedType :
  isTypeSubtypeOf(candidate, type) ? candidate :
  isTypeAssignableTo(type, candidate) ? type :
  isTypeAssignableTo(candidate, type) ? candidate :
  getIntersectionType([type, candidate]);
}
```

**mapType**

```typescript nums
function mapType(type: Type, mapper: (t: Type) => Type | undefined, noReductions?: boolean): Type | undefined {
    if (type.flags & TypeFlags.Never) {
        return type;
    }
    // label: not union 
    if (!(type.flags & TypeFlags.Union)) {
        return mapper(type);
    }
    const origin = (type as UnionType).origin;
    const types = origin && origin.flags & TypeFlags.Union ? (origin as UnionType).types : (type as UnionType).types;
    let mappedTypes: Type[] | undefined;
    let changed = false;
    for (const t of types) {
        const mapped = t.flags & TypeFlags.Union ? mapType(t, mapper, noReductions) : mapper(t);
        changed ||= t !== mapped;
        if (mapped) {
            if (!mappedTypes) {
                mappedTypes = [mapped];
            }
            else {
                mappedTypes.push(mapped);
            }
        }
    }
    return changed ? mappedTypes && getUnionType(mappedTypes, noReductions ? UnionReduction.None : UnionReduction.Literal) : type;
}
```

## type 이 union  일때 

mapped type 의  `mapper` 로 `t => isTypeStrictSubtypeOf(t, c)... ` 이 들어가고 

`(14)` 에서는  union 각 개별타입이 `c` 즉 `this is c` 의 subset 인지 검사하고 t,c 중에서 subset 을 `mappedTypes` 에 push

`25` return changed ? mappedType 마지막 return 문에서 subset 인것들만 union 타입으로 만들어 return 한다.

```typescript
type A = { kind: 'A'; data: 1 };
type B = { kind: 'B'; data: 2 };
type C = { kind: 'C'; data: 3 };

type ABC = A | B | C;

declare const isA: (value: unknown) => value is A;

declare const abc: ABC;

if (isA(abc)) {
  abc
  //    ^? const abc: A
}
```

## type 이 object 일때

`not union`  에서 subset 을 검사한다.

등 많은 함수를 거쳐서 검사한다.

narrow 타입은  두 타입중 `subType` 으로 추론된다.

```typescript
declare const precateFun: (value: unknown) => value is {a : 1};
declare const a:{a : number}
if(precateFun(a)){
  a
  //    ^? const a: { a: 1; }
}

declare const precateFun: (value: unknown) => value is {a : number};
declare const a:{a : 1}
if(precateFun(a)){
  a
  //    ^? const a: { a: 1; }
}
```

## type is not assignable to narrowType

intersection 으로 타입을 만들어 버린다.  `**getNarrowedTypeWorker 마지막줄 참고(1)**`

```typescript
declare const precateFun: (value: unknown) => value is string;
declare const a:{a : 1}
if(precateFun(a)){
  a
  //    ^? const a: { a: 1; } & string
}

```

if 안에 a 는 { a: 1; } & string 이렇게 intersection 타입으로 변화시킨다 실제로는 never 이다.

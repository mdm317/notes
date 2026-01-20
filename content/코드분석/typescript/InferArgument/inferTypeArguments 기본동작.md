---

---
### inferTypeArguments

이 함수에서 context 에 candidate 를 넣는다.

```typescript
function inferTypeArguments(node: CallLikeExpression, ..., context: InferenceContext): Type[] {
```

```typescript
// in inferTypeArguments
for (let i = 0; i < argCount; i++) {
  const arg = args[i];
  if (arg.kind !== SyntaxKind.OmittedExpression) {
    const paramType = getTypeAtPosition(signature, i);
    if (couldContainTypeVariables(paramType)) {
      const argType = checkExpressionWithContextualType(
        arg,
        paramType,
        context,
        checkMode
      );
      inferTypes(context.inferences, argType, paramType);
    }
  }
}
```

inferTypes 호출 위의 코드를 호출 된다

### inferTypes

```typescript
function inferTypes(inferences: InferenceInfo[], originalSource: Type, originalTarget: Type){
	...
	function inferFromTypes(source: Type, target: Type): void {
		...
		if (target.flags & TypeFlags.Union) 
		...
		if (target.flags & TypeFlags.TypeVariable){
			...
			inference.contraCandidates = append(inference.contraCandidates, candidate);
		}
	}
}
```

inferTypes는 source 와 target 의 타입들을 분해해서 inferFromTypes를 재귀적으로 호출한다. 

> 만약 object type 일경우  *inferFromObjectTypes ⇒ inferFromProperties, inferFromSignatures, inferFromIndexTypes
inferFromProperties 에서는 inferFromTypes 에 source, target 의 Property 들을 inferFromTypes 넣어서 호출한다.*

최종적으로는 targe type 이 TypeVariable이 될떄까지 분해하고 `append` 를 호출해서 `context` 의 `candidate` 에 추가한다.`TypeVariable` 에 `type` candidate 를 추가한다.

가장 기본적인 흐름이다.

### 예제 1

CallLikeExpression 일때 infer argement 을 해서 `node: CallLikeExpression` 을 arg 로 호출

```typescript
function identity<T>(value: T): T {
  return value;
}

identity({ a : 1 })
```

`identity({ a : 1 })` 를 호출하게 되면 T 에는 { a : number } ( { a : 1} 이 아님을 유의)이 candidate 로 추가된다.

### 예제 2

```typescript
function identity<T>(value: { a : T }): T {
  return value;
}

identity({ a : 1 })
```

T에는 1 이 candidate 로 추가된다.

## candidate 가 서로 다른 타입이 추가될때 

```typescript
declare function f<T>(arg: {
  state:T;
  cb : (arg:any)=>T;
}): any;

f({
  state: 1,
  cb:(arg:string)=>'4',
}); 
```

위의 코드에서 candidate 는 `string` 과 `number` 가 추가

*getInferredType ⇒ getCovariantInference ⇒ getCommonSupertype ⇒ getSingleCommonSupertype*

제일 처음 추가된 candidate 로 타입이 추론됨 T 는 `number` 으로 추론됨

```typescript
declare function f<T>(arg: {
  cb : (arg:any)=>T;
  state:T;
}): any;
```

제일 처음 추가된 candidate 를 선택하기 떄문에 위 코드에는 T 는 `string` 으로 추론됨

이건 잘못 설계된 타입이고 `NoInfer` 를 이용해서 추론할 타입을 정해야함

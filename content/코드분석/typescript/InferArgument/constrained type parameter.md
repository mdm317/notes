---

---



```typescript
function getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {  return obj[key];}
let x = { a: 1, b: 2, c: 3, d: 4 };
getProperty(x, "e");
```

기본적인 동작

`“e”` 가  `Key extends keyof Type` 에 할당 가능한지 검사하는 로직

`inferTypeArguments` ⇒ `inferTypes` ⇒ `getInferredTypes`*
*

`Key extends keyof Type` 의 타입을 구하는 코드

```typescript
	//getInferredTypes
  
  const constraint = getConstraintOfTypeParameter(inference.typeParameter);
	  if (constraint) {
	      // 1
	      const instantiatedConstraint = instantiateType(constraint, context.nonFixingMapper);
	      if (!inferredType || !context.compareTypes(inferredType, getTypeWithThisArgument(instantiatedConstraint, inferredType))) {
	          // If the fallback type satisfies the constraint, we pick it. Otherwise, we pick the constraint.
	          inference.inferredType = fallbackType && context.compareTypes(fallbackType, getTypeWithThisArgument(instantiatedConstraint, fallbackType)) ? fallbackType : instantiatedConstraint;
	      }
	  }
```

`instantiateType` ⇒ `instantiateTypeWithAlias` ⇒ `instantiateTypeWorker` ⇒ `getMappedType`

을 호출하고 `getMappedType` 은 `createInferenceContextWorker` 로 만든`makeNonFixingMapperForContext` 를 호출한다.(1) 참고

(2) `Key extends keyof Type` 의 `Type` 과 `sources` (3) 의 `Type` 이 같을 경우 `targets` 를 호출해서

(5) 가 호출된다.

(5)는 `{ a : 1 }` 이라는 타입을 다시 얻어오고 

`instantiateType` ⇒ `instantiateTypeWithAlias` ⇒ `instantiateTypeWorker` ⇒* *`getIndexType` ⇒ `getLiteralTypeFromProperties`

를 호출해서 결국 `a` 이라는 타입을 얻어낸다.

```typescript
// instantiateTypeWorker
if (flags & TypeFlags.TypeParameter) {
    const mappedType =  getMappedType(type, mapper);
    return mappedType
}

//
function getMappedType(type: Type, mapper: TypeMapper): Type {
    switch (mapper.kind) {
		    //...
        case TypeMapKind.Deferred: {
            const sources = mapper.sources;
            const targets = mapper.targets;
            for (let i = 0; i < sources.length; i++) {
                if (type === sources[i]) { //2
                    return targets[i]();  // 3
                }
            }
            return type;
        }
        //...
   }
}
//createInferenceContextWorker
```

`createInferenceContextWorker`

```typescript
    function makeNonFixingMapperForContext(context: InferenceContext) {
        return makeDeferredTypeMapper(
            map(context.inferences, i => i.typeParameter), //4
            map(context.inferences, (_, i) => () => {
                return getInferredType(context, i); //5
            }),
        );
    }

function createInferenceContextWorker(inferences: InferenceInfo[], signature: Signature | undefined, flags: InferenceFlags, compareTypes: TypeComparer): InferenceContext {
    const context: InferenceContext = {
        inferences,
        signature,
        flags,
        compareTypes,
        mapper: reportUnmeasurableMapper, // initialize to a noop mapper so the context object is available, but the underlying object shape is right upon construction
        nonFixingMapper: reportUnmeasurableMapper,
    };
    context.mapper = makeFixingMapperForContext(context);
    context.nonFixingMapper = makeNonFixingMapperForContext(context);
    return context;
}
```







```typescript
type MapM<T> = T extends {
  queryFn: any;
  queryKey: string[];
}
  ? {
      queryFn: any;
      queryKey: string[];
      select: (v: string) => void;
    }
  : T;
type QueriesOptions<T extends Array<any>> = T extends [infer Head]
  ? [Head]
  : T extends Array<unknown>
  ? T
  : never;

export function useQueries5<T extends Array<any>>(
  queries: [...QueriesOptions<T>]
): T {
  let a: any;
  return a;
}
const z = useQueries5([
  {
    queryFn: () => Promise.resolve(3),
    queryKey: ["123"],
  },
]);
```

*chooseOverload*

```typescript
// resolveCall
// chooseOverload
// 1
function chooseOverload(candidates: Signature[],
	if (candidate.typeParameters) {
	    let typeArgumentTypes: Type[] | undefined;
	    if (some(typeArguments)) {
	        typeArgumentTypes = checkTypeArguments(candidate, typeArguments, /*reportErrors*/ false);
	        if (!typeArgumentTypes) {
	            candidateForTypeArgumentError = candidate;
	            continue;
	        }
	    }
	    else {
	    		// 2
	        inferenceContext = createInferenceContext(candidate.typeParameters, candidate, /*flags*/ isInJSFile(node) ? InferenceFlags.AnyDefault : InferenceFlags.None);
```

 함수호출 `signature` 의 `typeParameters` 로 `createInferenceContext` 생성 (1), (2) 
위의 예제에서는 `<T>` 부분이 해당

`inferTypeArguments` 시작 ⇒

```typescript
// inferTypeArguments

for (let i = 0; i < argCount; i++) {
    const arg = args[i];
    if (arg.kind !== SyntaxKind.OmittedExpression) {
        const paramType = getTypeAtPosition(signature, i);
        if (couldContainTypeVariables(paramType)) {
            const argType = checkExpressionWithContextualType(arg, paramType, context, checkMode);
						//
            inferTypes(context.inferences, argType, paramType);
        }
    }
}
```

`argType` 이랑 `paramType` 얻고 *inferTypes 호출 *

예제코드에서 `paramType` 는` [...QueriesOptions<T>]` 에 해당

`*inferTypes*`* ⇒ *`*inferFromTypes*`* ⇒ *`*inferFromObjectTypes*`* ⇒ *`*inferWithPriority*`* ⇒ *`*inferFromTypes*`

한 루프 돌면서 target 에 해당하는  `[...QueriesOptions<T>]` 를 `QueriesOptions<T>` 로 분해

`QueriesOptions<T>`  이 현재 예제에서는 conditional type 이고 

`*inferFromTypes*`* ⇒ *`*inferToConditionalType*`* ⇒ *`*inferToMultipleTypes*`* ⇒ *`*inferFromTypes(source, trueType), inferFromTypes(source, falseType)*`

`*trueType*`*, *`*falseType*`* 일경우 모두 *`*inferFromTypes*`* 호출*

`*inferFromTypes*`* ⇒ *`*inferFromTypeArguments*`

`*inferFromTypes*`*  target 은 *`*Head*`* *



```typescript
type QueryFunction<  T = unknown,> = () => T | Promise<T>

interface QueryOptions<  TQueryFnData = unknown,  TData = TQueryFnData,  TQueryData = TQueryFnData,  > {   queryFn?: QueryFunction<TQueryFnData>   select?: (data: TQueryData) => TData}
type GetUseQueryOptionsForUseQueries<T> =  T extends {    queryFn?:QueryFunction<infer TQueryFnData>    select?: (data: any) => infer TData  }  ? QueryOptions<    TQueryFnData,    TData  >  : QueryOptions
declare function test<T>(arg: GetUseQueryOptionsForUseQueries<T>): any

declare function test2<T>(arg: QueryOptions<T>): any
test({  queryFn: () => Promise.resolve(4),  select: (data) => {}})
test2({  queryFn: () => Promise.resolve(4),  select: (data) => { }})
```
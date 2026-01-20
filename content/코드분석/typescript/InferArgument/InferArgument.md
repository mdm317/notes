---

---
 `typeParamater` 의 타입을 유추하는것

용어

- `candidate`
    - `typeParameter `가 될수 있는 타입의 후보
- context
    - 타입을 유추할 범위? Typeparamter 로 만듬

## context

```typescript
// in chooseOverload 
...
inferenceContext = createInferenceContext(candidate.typeParameters, candidate, /*flags*/ isInJSFile(node) ? InferenceFlags.AnyDefault : InferenceFlags.None);
...
```

candidate.typeParameters로 inferenceContext 를 만듬

[[inferTypeArguments 기본동작]]

[[constrained type parameter]]

[[context-senstive]]

[[with type annotaion]]


## 결론

### api의 타입을 설계할때 

1. typeParamter 는 object 로 안하는게 좋음
    1. callback(context-sensitive) 예제에서 문제 생길 가능성이 높음
    2. 좀더 쉽게 추론하려는 이슈도 있음 [https://github.com/microsoft/TypeScript/issues/53999](https://github.com/microsoft/TypeScript/issues/53999?utm_source=chatgpt.com)
2. argument 타입을 추론할때는 `Infer` 키워드를 안쓰는게 나음
    3. argument 타입을 미리 추론하고 `Infer`  키워드를 써야함
3. arg 를 배열로 받으면 callback 까지는 제대로 infer 안될 수 있음
	1. ts 내부에서 reverse mapping 사용


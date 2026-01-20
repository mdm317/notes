---

---

서버 컴포넌트에서 db call 을 unstable_cache 를 이용해서 캐쉬할 수 있음

데이터 변경시 revalidatePath 호출해야함

장점

- 컴포넌트내에서 fetch 를 안해도 됨
- 성능 지표 개선
    - fcp는 줄지만 유용한 콘텐츠가 보여지는 속도는 빠름
    - ttfb 늘어남
    - lcp 빨라짐
    - cls 차이 없음

단점

- Optimistic Ui 는 어려움










[https://nextjs.org/docs/app/api-reference/functions/revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)

[https://nextjs.org/docs/app/api-reference/functions/unstable_cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
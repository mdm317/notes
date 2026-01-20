---

---
[https://martinfowler.com/articles/modularizing-react-apps.html](https://martinfowler.com/articles/modularizing-react-apps.html)

위 글에서는 응집도 (cohesion) 을 직적접으로는 언급하지 않았다.

>  how *busy* the component is

라고 간접적으로 언급했다.

하지만 흩뿌려진 코드를 어떻게 나누고 뭉쳐야 하는지 말하는 글이라 응집도와 관련있다고 생각한다.

## 로직 분리

### 도메인

도메인 로직 === 데이터를 가져와서 프론트에 맞게 변경하는 동작들

이렇게 간주하고 위 글에서는 class 로 분리해서 구현했다.

class 로 처음부터 구현하기 보다는 zustand 에 코드를 위치해도 좋을것 같다.

### ui

컴포넌트 목적에 따라 랜더링되는 Ui 가 달라야한다.

- 예로 payment 컴포넌트와 paymentmethod 가 랜더링하는 ui 는 달라야 한다고 설명했다.

또한 Pure component 를 이용해서 ui 로직과 ui 로직이 아닌걸 분리하려고 했다.

### fetcing

useQuery 를 쓰는게 제일 좋아보인다.

다른 유저들의 의견들

[https://www.reddit.com/r/reactjs/comments/1jpk752/applying_solid_principle/](https://www.reddit.com/r/reactjs/comments/1jpk752/applying_solid_principle/)

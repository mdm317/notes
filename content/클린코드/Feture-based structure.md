---

---
최근 프론트엔드 오픈소스 프로젝트들을 살펴보는 중에 폴더 구조를 `features` 단위로 나누는 방식이 자주 등장한다는 점이다.

자세히 알아보기로 했다.

### **Screaming Architecture** 

소프트웨어 아키텍처의 구조만 봐도 시스템이 어떤 프레임워크를 쓰는지가 아니라 ‘무슨 문제를 해결하는지’ 명확하게 드러나야 한다고 한다.

```javascript
└── src/
    ├── components/
    ├── contexts/
    └── hooks/
```

이런 구조는 React 임이 명확하다.

```javascript
└── src/
    ├── features/
    │   ├── todos/
    │   ├── ui/
    │   └── users/
    └── pages/
```

이런식으로 폴더 구조를 만들면 이건 Todo 앱임을 파악할 수 있다.

### 기능별로 폴더 분리

Feature 파일 내부 파일 구조는 밑과 같이 하는게 제일 좋아 보였다.

- feature
    - components
    - utils
    - hooks
    - api, query
    - services, lib
    - store
    - __tests__
    - index.ts
    - sub-feature
    - types

실제 파일구조를 나눈 예들

[https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc](https://dev.to/pramod_boda/recommended-folder-structure-for-react-2025-48mc)

[https://dev.to/itswillt/folder-structures-in-react-projects-3dp8](https://dev.to/itswillt/folder-structures-in-react-projects-3dp8#:~:text=,make%20the%20right%20grouping%20decisions)

### services

db 까지 조회하는 풀스택으로 개발하는게 아닌이상 프론트만 개발할때는 몇개의 서로 다른 api 들을 불러와서 데이터를 변형해서 써야한다.

이를 domain logic, service logic 이라고 한다.

이 로직관련 코드를 어디에 놔야 하나도 갈리는것 같다.

- zustand
    - 장점
        - 비지니스 로직 코드를 분리할 수 있다.
        - 성능이 좋아질 수 있다.
    - 단점
        - React-query 와 같이 쓸때 냥
- hook
    - 단점
        - 성능에 신경써야한다. Usememo 등
- class
    - 단점
        - 코드가 리액트에 맞지 않아 보인다.

hook 으로 쓰는게 제일 나은것 같다.

밑의 그림은 배민이 business layer 를 어떻게 나누고 사용하는지  참고하면 좋을 것 같아서 첨부했다.

![[Screenshot_2025-08-14_at_2.25.00_PM.png]]

실제 구현예시는 훅으로 구현했을시에 usememo 를 써서 성능에 신경을 쓴것으로 보인다.

![[Screenshot_2025-08-14_at_2.57.34_PM.png]]

위의 예시에서 convertPocketPocketListViewModel 은 service 디렉토리로
usePocketListViewModel 은 hooks 디렉토리로 가면 좋을 것 같다.

추가적으로 서버에서의 타입명은 잘 안보여서 모르겠지만 프론트에서의 타입명은 [서버변수명]ViewModel 으로 만들었다.

출처

[https://www.youtube.com/watch?v=nkXIpGjVxWU](https://www.youtube.com/watch?v=nkXIpGjVxWU)

## kebab-case

별개로 오픈소스 프로젝트에서 파일과 폴더 이름을 `kebab-case`로 작성한 걸 본 적이 있다.

`next.js` 같은 프레임워크에서는 폴더명이 경로가 되니까 `kebab-case`를 사용하는 게 이해됐지만, 나머지는 왜 그런지 의문이었다

그러다 찾아보니, 운영체제마다 대소문자를 처리하는 방식이 달라서 CI 환경에서 에러가 발생할 수 있다는 이유로 `kebab-case`를 사용하는 경우도 있다고 한다.

생각해보면 나도 예전에 비슷한 에러를 겪은 적이 있었고 원인을 찾아내기가 어려웠었따., 당시에는 그냥 “이런 경우도 있구나 아주 짜증나는 에러네” 하고 넘어갔었다. 지금 생각하니 그때 좀 더 깊이 찾아봤으면 좋았을 것 같다.

### 실제 사용 라이브러리

- next
- shadcn
- cal.com
    - 혼재되어서 사용

어떤방식이던 팀에서 미리 결정하는게 중요한것 같다.


kent 의 트윗

![](https://x.com/kentcdodds/status/1249870276688371713)


출처

screaming architecture

[https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)

[https://www.milanjovanovic.tech/blog/screaming-architecture](https://www.milanjovanovic.tech/blog/screaming-architecture)

folder structure

[https://profy.dev/article/react-folder-structure](https://profy.dev/article/react-folder-structure?utm_source=chatgpt.com)

[https://blog.webdevsimplified.com/2022-07/react-folder-structure/](https://blog.webdevsimplified.com/2022-07/react-folder-structure/)

[https://www.robinwieruch.de/react-folder-structure](https://www.robinwieruch.de/react-folder-structure/?utm_source=chatgpt.com)




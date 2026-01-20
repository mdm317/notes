---

---

## 요구사항

- 일부 고객사들을 api 만 사용하길 원함
- peer depency때문에 고객사에서 빌드 에러가 잦음
    - material ui 의 버젼차이로 인한 에러
    - react의 버젼 차이로 인한 에러
        - react 를 peer dependency 로 가지고 있기때문에 web sdk 가 아닌 React 라이브러리라고 해야함
- React-script 1버젼이라 많이 느림

### 구현

- core 와 uikit를 분리해서 api 만 사용하길 원하는 고객사에는 core모듈만 제공
- peer dependency를 없애기

### 사용기술

- vite, preact, css, monorepo
- core 에는 jest 를 이용해서 Api 테스팅

## **uikit**

## **css**

- peerdependency를 없애고 css 클래스명이 겹치는 문제를 해결하기 위해서는 css 작업이 필요
- 다른 라이브러리들을 어떻게 작업했나 조사
1. toast callender
    1. Css 로 만들고 postcss 에서 classname prefix에 `toastui-calendar-` 를 붙여줌
2. egjs
    2. sass 로 만들고 prefix 없음
- mojitok uikit 는 작성될 css 양이 많으므로 1번으로 가는게 css classname 중복에 영향을 적게 줄것으로 예상됨

### css 문제점

3. 1번에서 리액트 코드 내에서 prefix를 주고 싶은데 함수로 만들어서 class 에 넣어주면 Rerender 때 마다 실행 prefix함수가 실행됨
4. usememo 를 이용할수도 있지만 작업해야 하는 코드양이 너무 늘음
- 빌드 타입에서 해결하고 싶어서 조사
    - [npm: babel-plugin-search-and-replace](https://www.npmjs.com/package/babel-plugin-search-and-replace)  로 `#mpx@` 를 prefix 로 바꿔서 해결

## **빌드환경 **

- monorepo (yarn workspace)
- vite build
    - [Vite ](https://vitejs.dev/guide/build.html#library-mode)[Rollup](https://rollupjs.org/guide/en/#big-list-of-options)
    - cjs 로 빌드할때 using named and default exports together. 를 같이 쓰면 안좋은 이유
 https://github.com/rollup/rollup/issues/1961 

**문제점**

- vite 에서 react 환경에서는 정상적으로 작동하는데 preact 방식에서는 작동하지 않음
    - vite 에는 preact plugin을 제공해주지 않고 직접작성하기에는 나중에 유지보수문제도 있을것으로 예상되어 공부만 진행하고 yarn berry 방식을 사용하지 않기로 함

## **개선사항**

- 개발서버를 키는데 드는 시간 단축 1:30 sec → 3 sec
- 빌드속도 개선  46 sec → 6 sec
- 번들 사이즈 감소
- dependency 제거 injected dependencyy 3 + 11 → uikit 3+ core 2

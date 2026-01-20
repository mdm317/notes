---

---
[bellypartypass.xyz/](https://api.bellypartypass.xyz/)

bellygom nft 를 가지고 있는 사람들에게 qr로 입장권을 만들어 주는 사이트

요구사항

- 지갑연동
- 서명
- qr 입장권

kalytn api 를 이용해서 모두 간단하게 구현 할 수 있었다.

모바일 환경이다 보니까 로딩 성능에 신경을 썼다.

![[load.webm]]

위 화면에서 문제가 된던것

- 배너 이미지 로딩 속도가 느림
- 글자가 늦게 보여짐

개선

- preload 사용
- font-display 속성 사용

<!-- Column 1 -->
![[move.webm]]

<!-- Column 2 -->
![[move2.webm]]

문제점

- 돔 조작이 일어날때 이미지 로딩 속도가 느림

개선

- [XMLHttpRequest](https://developer.mozilla.org/ko/docs/Web/API/XMLHttpRequest)s 로 특정 시점에 이미지를 미리 로딩

### 최종 플로우

![[flow.webm]]

## 느낀점

next 에서는 폰트 최적화, 이미지 preload를 모두 지원한다.
또한 spa 도 지원한다.

다음에는 그냥 next를 쓰자

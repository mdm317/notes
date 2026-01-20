---

---
## 요구사항

- After Effects로 만든 json 파일에서 에셋을 교체해, 유저마다 다른 애니메이션을 보여줄 수 있는 기능
- 모바일에서도 문제없이 동작
- twitter player card 에 업로드 가능
- 보여지는 에니메이션을 다운로드 할 수 있는 기능

###  에셋 교체

- 이미지

```javascript
  "assets": [
    {
      "id": "axie image color.png",
      "w": 1280,
      "h": 960,
      "u": "images/",
      "p": "img_0.png",
      "e": 0
    },
```

위 json 에서 u,p 변경

- 폰트
    - svg 랜더시
        - .json fonts/list 에 데이터 추가됨
        - 웹에서 별도로 로딩 필요
    - canvas
        - after effect 에서 설정 변경해야함
            -  https://github.com/airbnb/lottie-web/issues/3104 
        - .json에 char 관련 데이터 추가됨

정상적인 에니메이션을 위해 웹에서 이미지 에셋과 폰트가 모두 로딩되었을때 재생함수 호출해야 함

## 모바일에서의 재생

- mobile 에서는 frame drop 으로 light-lottie 사용도 가능
    - glare 효과는 적용되지 않음
    - [https://github.com/airbnb/lottie-web/wiki/Lottie-Light](https://github.com/airbnb/lottie-web/wiki/Lottie-Light)

## twitter player card

[https://developer.x.com/en/docs/x-for-websites/cards/overview/player-card#testing](https://developer.x.com/en/docs/x-for-websites/cards/overview/player-card#testing) 
이 문서 따라하면 동작 meta data 를 잘 성정해야함

## 다운로드

### svg

svg→ png → gif

너무 느림

- lottie 에서 canvas 형식은 정상적으로 표현이 안되는 경우도 있음
    - code 를 본 결과 lottie json 에 char가 필요한데 없어서 에러가 나옴
- gif 형식으로 바꾸게 되면 상당히 느리다. 기능이 정상적으로 동작한다고 볼수 없다.
    - svg 를 이용해 만들기
        - flow
            - svg → blob → image → make gif
        - blob 으로 만들때 필요한 과정
            - xlink:href → href
            - font 가 적용 안되는문제
                - text → path
                    - 너무 오래 걸림
                - **svg 안에 font-face 재정의**
                    - 훨씬 빨라서 이방법으로 함
        - [https://shitnever.works/2021/06/02/converting-svg-to-an-image-via-blob/](https://shitnever.works/2021/06/02/converting-svg-to-an-image-via-blob/)

위의 방법을 적용해서 구현한다해도 브라우저가 멈춰버리는 현상 발생

## canvas

로딩전 .Json 파일에 char Data가 존재해야 rendering 가능

모든 char 데이터를 만들어 놓고 rendering 전에 요청에서 .json 파일을 동적으로 만들면 가능

마찬가지로 gif 형식으로 바꾸는 기능은 느림

## skottie

svg 엔진을 검색하다가 알게된 라이브러리

wasm 으로 구현 +  ffmpeg (wasm) 으로 빠른 동영상 인코딩 가능


---

---
오픈일에 1000명이 민팅한 axie card generator 페이지 구현 

axie 를 가지고 있는 유저들에게 민팅, twitter 공유, 

기능

- minting
- twitter 공유
    - twitter player card 사용 
![[3.webm]]
- lottie 재생
    - 디자이너와 협업해서 after-effect 규약 정의 (aka, file 이름, 이미지 에셋 정의 )
    - axie 마다 다른 화면 재생
![[2.webm]]
![[1.webm]]
    - mobile 에서는 frame drop 으로 light-lottie사용
        - glare 효과 제거됨
lottie 다운로드 기능
- wallpaper 다운로드
    - node-canvas 를 사용해서 pixel 단위로 구현
![[pc-wallpaper.png]]
![[twitter-wallpaper.png]]
![[mobile-wallpaper.png]]

 
[[Lottie 다운로드]]
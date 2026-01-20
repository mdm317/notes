---

---
### 문제점

IPFS 링크를 사용해서 `<img>` 태그로 이미지를 렌더링하고 있었다

1. Img 랜더링
2. 에러시 video 태그로 랜더링
3. 에러시 에러 ui 보여줌

하지만 Chrome과 Safari 가보여지는 화면이 달랐다.

### 문제 파악

safari 는 img 태그에 h264 인코딩된 비디오를 사용할수 있다고 한다.

동영상이 safari 에서는 `<img/>` 태그로 재생, chrome, firefox 에서는 `<video/>` 로 재생되고 있었다.

### 원인

safari 에서는 img 태그에 mp4 를 넣어서 재생할수 있었다.

safari 에서의 개발 배경

4. 비디오 preload 안되서 유저한테 늦게 보여질 수 있다.
5. 오른쪽 우클릭을 누르고 저장이 불가능
6. autoplay 속성을 남용하는걸 방지할 수 있다.

### 느낀점

개인적으로는 1,2 번도 용량이 낮은 동영상을 썼을떄만 이점이 있다고 느껴졌다.

굳이 개발할 정도로 이득이 가져온다고 생각되지 않았다.

사실 이런 에러를 마추질 일이 거의 적을 것같다. 

개발문서에서 알려준것 처럼 webm 이라는 새로운 포멧도 있고 개발문서랑은 다르게 요즘에는 webm이 많이 보편화 되었기 때문이다. 


관련자료

[https://developer.apple.com/documentation/webkit/delivering_video_content_for_safari](https://developer.apple.com/documentation/webkit/delivering_video_content_for_safari)

[https://webkit.org/blog/8216/new-webkit-features-in-safari-11-1/](https://webkit.org/blog/8216/new-webkit-features-in-safari-11-1/)

[https://lapcatsoftware.com/articles/img1.html?utm_source=chatgpt.com](https://lapcatsoftware.com/articles/img1.html?utm_source=chatgpt.com)

[https://html.spec.whatwg.org/multipage/embedded-content.html#attr-img-src](https://html.spec.whatwg.org/multipage/embedded-content.html#attr-img-src)

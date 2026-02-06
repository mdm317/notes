
overlay scroll 인 경우에 html overflow style 을 변경시에 전체트리 reflow 가 발생하고 있었다.

[[전체트리 recalculate 발생 원인]]

원인을 찾아보니 
자식노드중 하나가 
`max-height: calc(8.75lh + 0.5rem);`
이 스타일을 가지고 있었고 

스크롤을 막히위해 html overflow 를 hidden 으로 변경할때 발생헀다.

html 의 css 만 변경하지 않으면 되어서 overflow를 body 쪽으로 옮겼다.



https://github.com/mui/base-ui/pull/3793


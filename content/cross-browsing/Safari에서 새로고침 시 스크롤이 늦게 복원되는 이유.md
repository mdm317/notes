
Safari에서 페이지를 새로고침했을 때, 스크롤이 즉시 복원되지 않고 제일 상단(y=0)이 보였다가 원래 위치로 내려가는 현상이 발생

## 코드
```cpp {11}

void FrameLoader::didFirstLayout()
{
   if (m_frame->page() && isBackForwardLoadType(m_loadType))
        restoreScrollPositionAndViewStateSoon();
    }
}

```
fistlayout 시에 load 이벤트는 scroll 복원하지 않음

```cpp {4}
void FrameLoader::checkLoadCompleteForThisFrame(LoadWillContinueInAnotherProcess loadWillContinueInAnotherProcess)
{
	if (m_frame->page()) {
		if (isBackForwardLoadType(m_loadType) || isReload(m_loadType))
			history().restoreScrollPositionAndViewState();
	}
}

```

load 시에는 isReload, isBackForwardLoadType 둘다 복원
## 정리

WebKit의 reload 스크롤 복원 기능이 first layout 에서는 하지 않기떄문 
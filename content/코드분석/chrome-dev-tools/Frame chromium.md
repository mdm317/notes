chromium 에서 frame은 한 프레임을 의미하지 않음 
하나의 싸이클로 이해하면 됨
[life-of-frame](https://chromium.googlesource.com/chromium/src/+/lkgr/docs/life_of_a_frame.md)

## 핵심 용어
### BeginFrame
BeginImplFrame starts a compositor frame (with each vsync)
[[perfetto ui#begrinFrame 조회]]

### Draw Frame

During draw Display Compositor will go over quads and render passes in the aggregated compositor frame and produce draw commands. For SkiaRenderer it's recording of Deferred Display Lists (DDL)


## devtools-frontend 에서 frame 을 표시 하는 방식


front_end/models/trace/handlers/FramesHandler.ts
이 파일에서 frame panel 에 그릴 frame 데이터를 만듬

```ts

export class TimelineFrameModel {
  #frames: TimelineFrame[] = [];
}

```
최종적으로 `#frames` 에 데이터 저장

실제로는 코드가 더 있지만 handleBeginFrame, handleDrawFrame 만 분석
```ts
  #processCompositorEvents(entry: FrameEvent): void {
    if (Types.Events.isBeginFrame(entry)) {
      this.#handleBeginFrame(entry.ts, entry.args['frameSeqId']);
    } else if (Types.Events.isDrawFrame(entry)) {
      this.#handleDrawFrame(entry.ts, entry.args['frameSeqId']);
    }
  }
```



```ts nums
 #handleBeginFrame(startTime: Types.Timing.Micro, seqId: number): void {
    if (!this.#lastFrame) {
      this.#startFrame(startTime, seqId);
    }
    this.#lastBeginFrame = startTime;

    this.#beginFrameQueue.addFrameIfNotExists(seqId, startTime, false, false);
  }

#handleDrawFrame(startTime: Types.Timing.Micro, seqId: number): void {
	const framesToVisualize = this.#beginFrameQueue.processPendingBeginFramesOnDrawFrame(seqId);
	for (const frame of framesToVisualize) {
        const isLastFrameIdle = this.#lastFrame.idle;
        this.#startFrame(frame.startTime, seqId);
	}        
}

#startFrame(startTime: Types.Timing.Micro, seqId: number): void {
	if (this.#lastFrame) {
      this.#flushFrame(this.#lastFrame, startTime);
    }
    this.#lastFrame =
        new TimelineFrame(seqId, startTime, Types.Timing.Micro(startTime - metaHandlerData().traceBounds.min));
  }
  
#flushFrame(frame: TimelineFrame, endTime: Types.Timing.Micro){}

```


### 세가지 데이터 필드로 동작 분석
 - lastFrame
	 - frames 로 넣기 전의 frame 데이터
 - frames
	 - 최종적으로 저장된 frame 데이터
 - beginFrameQueue
	 - BeginFrame 후보 큐


## 예시 시나리오

### BeginFrame(1, id=1)

(3)-> (18) 를 호출해서 현재의 startTime 을 같는 TimelineFrame 데이터를 lastFrame 프레임에 저장 
(7) 를 호출해서 beginFrameQueue 저장 

| lastFrame | frames | beginFrameQueue |
|----------|--------|----------------|
| Frame(start=1) | [] | [(1,1)] |

---

### BeginFrame(2, id=2)

(7) 를 호출해서 beginFrameQueue 저장 

| lastFrame | frames | beginFrameQueue |
|----------|--------|----------------|
| Frame(start=1) | [] | [(1,1), (2,2)] |

---

### DrawFrame(3, id=2)

(11) processPendingBeginFramesOnDrawFrame 이 함수에서 seqId 가 같지 않는 id 는 모두 `beginFrameQueue` 에서 제거후 seqId 가 같은 DrawFrame 반환

frame(12 ) 는 beginFrame event(startTime : 2, id: 2)  이 데이터를 가짐

14-> 18 -> 20  -> 26
을 호출하고 되고  frame(12 ) 의 startTime 이 flushFrame 의 두번째 인자의 endTime 으로 호출
최종적으로 frame 데이터는 start time은 1이 end time 은 2가 됨

| lastFrame | frames | beginFrameQueue |
|----------|--------|----------------|
| Frame(start=2) | [Frame(start=1, end=2)] | [] |

---
### 결론
performace 탭에서 frame 은 chronium 의 작업 단위를 보여준다
가장 첫번쨰 발생의 beginFrame 부터 DrawFrame 까지의 시간을 보여주기 떄문에 
시간이 매우길게 보여지는 경우들이 있다.
하지만 idle 상태(초록색) 으로 보여진다면 문제 없다.

![[Screenshot 2026-01-11 at 1.44.35 PM.png]]

![[Screenshot 2026-01-11 at 1.43.51 PM.png]]




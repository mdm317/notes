

# 이벤트 루프, Task, 그리고 Microtask — 스펙  

> Chrome DevTools Performance 탭을 열어보면, 클릭 한 번에 **`Task`** 라는 막대가 뜨고 그 안에 **`Run Microtasks`** 가 들어 있다.  
> "이 Task는 뭐고, microtask는 왜 그 안에 같이 있지?" 라는 질문에서 시작해, HTML 스펙과 Blink/WebKit 소스까지 따라가 봤다.  

---  

## 'task' 란  

callback 실행, DOM 변경에 대한 반응, 파싱 등의 작업은 모두 **task라는 단위로 표현된다.**  

> **Tasks encapsulate algorithms that are responsible for such work as:** Events, Parsing, Callbacks, Using a resource, Reacting to DOM manipulation.  

즉 task는 이벤트·파싱·콜백·리소스 사용·DOM 조작 반응 같은 일을 담당하는 **알고리즘을 캡슐화한 것**이다. 그리고 이 task들은 **task 큐**에 담긴다 — 다만 스펙이 이걸 "큐"가 아니라 **집합(set)** 이라고 못 박는다는 점이다.  

> **Task queues are sets, not queues**, because the event loop processing model grabs the first runnable task from the chosen queue, instead of dequeuing the first task.  

맨 앞을 무조건 꺼내는(dequeue) 게 아니라, **"실행 가능한(runnable)" 첫 task를 골라** 가져가기 때문이다. 그래서 자료구조상 큐가 아니라 set 이다.  

---  

## 이벤트 루프의 한 바퀴  

이 task들을 실제로 실행시키는게 **이벤트 루프**다. 스펙(§8.1.7.3 Processing model)이 정의한 한 바퀴의 앞부분은 이렇게 생겼다.  

```
1. oldestTask, taskStartTime 를 null 로 둔다
2. runnable task 가 있는 task 큐가 있으면:
   2.2  taskStartTime = 현재 시각
   2.3  oldestTask = 큐의 첫 runnable task, 큐에서 제거
   2.6  Perform oldestTask's steps        ← ★ task 실행
   2.8  Perform a microtask checkpoint     ← ★ microtask 전부 실행
3. taskEndTime = 현재 시각
4. Report long tasks (taskStartTime, taskEndTime, ...)
```

핵심은 **2.6 → 2.8**의 배치다. **task를 하나 실행하고(2.6), 곧바로 microtask를 비운다(2.8).** 그 사이에 다음 task를 꺼내는 단계가 없다. 그래서 microtask는 **항상 다음 task보다 먼저** 실행된다   

---  

## microtask와 task 의 차이  


> **A microtask is a colloquial way of referring to a task** that was created via the queue a microtask algorithm.  

`queue a microtask` 알고리즘도 `Let microtask be **a new task**`로 시작한다. 즉 microtask도 똑같은 task 구조체이고, 차이는 단 세 가지뿐이다.  

- **source**가 `microtask task source`  
- **task 큐가 아니라 microtask 큐**에 들어감  
- **실행 시점**이 현재 task 끝의 microtask checkpoint  

### 그런데 왜 이런 차이를 만들었나?  

- 비동기로만 실행되어야함  
- 다른 task 전에 실행되야함   

만약  promise가  동기 + 비동기로 된다면 타이밍에 따라 순서가 바뀔수있음 <"Don't release Zalgo">  


## long task는 'task + microtask'다  

스펙에서 시간을 찍는 위치를 보면:  

- `taskStartTime` → **task 실행 전**(step 2.2)  
- `taskEndTime` → **microtask checkpoint 후**(step 3)  

그리고 step 4에서 `taskEndTime − taskStartTime`을 `Report long tasks`로 보고한다. 결론:  

> **long task = task 본문 + 그 task가 만든 microtask 의 합산 시간.** 이 값이 50ms를 넘으면 long task.  

그래서 클릭 핸들러 안에서 무거운 promise 체인이나 `queueMicrotask`를 돌리면, **그 microtask 시간까지 합쳐서** 50ms를 넘으면 long task로 잡힌다.  

### 할수있는 오해  

"fetch 응답이 핸들러 도중 도착하면 그 `.then`이 클릭 task에 합산되는 거 아냐?" → **아니다.** fetch 같은 비동기 I/O 완료는 **그 자체가 별도의 task**(networking task)로 메인 스레드에 들어온다. 메인 스레드는 단일 스레드 + run-to-completion이라, **클릭 task가 실행되는 동안 끼어들 수 없다.** fetch의 `.then`은 응답을 처리하는 그 networking task의 microtask checkpoint에서 실행되므로, 클릭 task 시간에는 포함되지 않는다.  

합산되는 건 어디까지나 **핸들러 실행 *중에* 큐에 들어간 microtask**(이미 resolved된 promise, `queueMicrotask`, 동기적으로 시작된 promise 체인)뿐이다. 기준은 단 하나 — **"microtask가 언제 큐에 들어갔나"**.  



## 정리  

1. **task** = 이벤트·콜백 등을 캡슐화한 작업 단위. task 큐는 "큐"가 아니라 set.  
2. **이벤트 루프 한 바퀴** = `task 1개 실행 → microtask 전부 → (기회 되면) 렌더링`.  
3. **microtask도 task다.** "동기는 너무 이르고, 새 task는 너무 늦은" 틈을 메우는 단위 (Promise·MutationObserver가 계기).  
4. **DevTools의 "Task"** = 스케줄러 `RunTask`이지 스펙 task가 아니다. 클릭은 `Task → EventDispatch → 핸들러 → Run Microtasks`로 보인다.  
5. **long task = task + 그 task의 microtask 시간** (50ms 초과 시). 단, 비동기 I/O 완료(fetch)는 별도 task라 합산되지 않는다.  


출처  
https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/index.html  
https://html.spec.whatwg.org/multipage/webappapis.html  
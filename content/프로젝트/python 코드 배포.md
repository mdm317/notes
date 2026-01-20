---

---
### 배경

- ai 관련 파이썬 코드를 js 에서 간편히 실행하고 싶음
- 계속 수정될 예정이기 때문에 js 로 포팅해서 사용하는 방법은 반려

### 해결방법

serverless 라는 라이브러리를 찾음 

serverless 사용하면 간단하게 cli 로 파이썬 코드 배포 가능

### 문제점

- requirement 에러
    - 원인
        - os 가 다를시 lambda 함수에서 에러 발생
    - 해결방법
        - serverless-python-requirements 사용
        - [https://www.serverless.com/plugins/serverless-python-requirements#cross-compiling](https://www.serverless.com/plugins/serverless-python-requirements#cross-compiling)

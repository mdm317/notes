---

---
사용자의 NFT를 불러와 자랑하는 웹사이트를 만들고 있는데, **인증 코드 구현에서 어려움을 겪었습니다.** 다른 Web3 서비스와 달리 자동 로그인 + siwe 기능이 필요했기 때문입니다.


```mermaid
graph TD
      subgraph FRONTEND["🔷 프론트엔드 처리"]
          A[회원가입 시작]
          B{기존 인증 상태 확인}
          E[약관 동의]
          F[SIWE 인증 프로세스]
          L[SIWE 메시지 생성]
          M{서명 결과}
          O[로그인]
      end

      subgraph SERVER["🔹 서버 요청"]
          G[Nonce 요청]
          H[Sign 값 검증]
          I[사용자 검증]
      end

      subgraph WALLET["🔸 지갑 요청"]
          D[지갑 연결 요청]
          J[SIWE 메시지 서명]
          K[지갑 주소 변경 감지]
      end

      N[회원가입 취소]
      C[서비스 이용]
      P[자동 로그아웃]

      A --> B
      B -->|이미 인증됨| C
      B -->|미인증| D
      D --> E
      E --> F
      F --> G
      G --> L
      L --> J
      J --> M

      M -->|성공| H
      M -->|사용자 거부| N
      M -->|에러| N

      H --> I
      I --> O
      O --> C

      C --> K
      K -->|지갑 변경 감지| P
      K -->|같은 지갑| C

      E -->|거부| N

      style SERVER fill:#1a1a2e,stroke:#16213e,stroke-width:2px,color:#ffffff
      style WALLET fill:#0f3460,stroke:#16213e,stroke-width:2px,color:#ffffff
      style FRONTEND fill:#2d1b36,stroke:#4a148c,stroke-width:2px,color:#ffffff
      style N fill:#4a1c1c,color:#ffffff
      style C fill:#1e4620,color:#ffffff
      style P fill:#4a1c1c,color:#ffffff
```

필요한 상태가 너무 많았다.

만약 다시 이때로 돌아간다면 무조건 xstate 를 사용할 것이다.

그 때도 카카오 블로그를 통해서 알기는 했는데 왜? 도입해야 하는가에 대해 대답하지 못했다.

지금은 **선언적으로** 상태를 구현할수 있다.  라고 자신있게 말할수 있다.

코드도 3가지 훅으로 

- 지갑관련
- 서버 관련
- 자동으로 다음단계로 넘어가는 훅

구성되어있었다.차라리 합치는게 나았을거라고 생각한다.

어디서 에러가 나는지  디버깅이 거의 불가능한 코드였다.(나만이 디버깅할수 있는 코드…)

나중에 ai 로 작성한 xstate 예제

물론 똑같이 돌아가진 않겠지만 훨씬 좋아보인다.

```javascript
import { createMachine, assign } from 'xstate';

interface AuthContext {
  address?: string;
  nonce?: string;
  signature?: string;
  signMessage?: string;
  error?: string;
}

type AuthEvent =
  | { type: 'START_SIGNUP' }
  | { type: 'ALREADY_AUTHENTICATED' }
  | { type: 'NOT_AUTHENTICATED' }
  | { type: 'WALLET_CONNECTED'; address: string }
  | { type: 'AGREE_TERMS' }
  | { type: 'REJECT_TERMS' }
  | { type: 'NONCE_SUCCESS'; nonce: string }
  | { type: 'NONCE_ERROR'; error: string }
  | { type: 'MESSAGE_GENERATED'; message: string }
  | { type: 'SIGN_SUCCESS'; signature: string }
  | { type: 'SIGN_REJECTED' }
  | { type: 'SIGN_ERROR'; error: string }
  | { type: 'VERIFICATION_SUCCESS' }
  | { type: 'VERIFICATION_ERROR'; error: string }
  | { type: 'USER_VERIFIED' }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'WALLET_CHANGED' }
  | { type: 'WALLET_SAME' }
  | { type: 'LOGOUT' };

export const authMachine = createMachine<AuthContext, AuthEvent>({
  id: 'auth',
  initial: 'idle',
  context: {},
  states: {
    idle: {
      on: {
        START_SIGNUP: 'checkingAuth'
      }
    },
    
    checkingAuth: {
      on: {
        ALREADY_AUTHENTICATED: 'serviceActive',
        NOT_AUTHENTICATED: 'connectingWallet'
      }
    },
    
    connectingWallet: {
      on: {
        WALLET_CONNECTED: {
          target: 'agreeingTerms',
          actions: assign({
            address: (_, event) => event.address
          })
        }
      }
    },
    
    agreeingTerms: {
      on: {
        AGREE_TERMS: 'siweProcess',
        REJECT_TERMS: 'signupCancelled'
      }
    },
    
    siweProcess: {
      initial: 'requestingNonce',
      states: {
        requestingNonce: {
          on: {
            NONCE_SUCCESS: {
              target: 'generatingMessage',
              actions: assign({
                nonce: (_, event) => event.nonce
              })
            },
            NONCE_ERROR: {
              target: '#auth.signupCancelled',
              actions: assign({
                error: (_, event) => event.error
              })
            }
          }
        },
        
        generatingMessage: {
          on: {
            MESSAGE_GENERATED: {
              target: 'signing',
              actions: assign({
                signMessage: (_, event) => event.message
              })
            }
          }
        },
        
        signing: {
          on: {
            SIGN_SUCCESS: {
              target: '#auth.verifyingSignature',
              actions: assign({
                signature: (_, event) => event.signature
              })
            },
            SIGN_REJECTED: '#auth.signupCancelled',
            SIGN_ERROR: {
              target: '#auth.signupCancelled',
              actions: assign({
                error: (_, event) => event.error
              })
            }
          }
        }
      }
    },
    
    verifyingSignature: {
      on: {
        VERIFICATION_SUCCESS: 'verifyingUser',
        VERIFICATION_ERROR: {
          target: 'signupCancelled',
          actions: assign({
            error: (_, event) => event.error
          })
        }
      }
    },
    
    verifyingUser: {
      on: {
        USER_VERIFIED: 'loggingIn'
      }
    },
    
    loggingIn: {
      on: {
        LOGIN_SUCCESS: 'serviceActive'
      }
    },
    
    serviceActive: {
      on: {
        WALLET_CHANGED: 'autoLogout',
        WALLET_SAME: 'serviceActive'
      }
    },
    
    signupCancelled: {
      type: 'final'
    },
    
    autoLogout: {
      type: 'final'
    }
  }
});
```
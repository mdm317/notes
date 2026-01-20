## setup
### get code

`fetch --no-history chromium`
no-history 하는게 좋음 .git 용량이 30기가를 넘음
fetch 시간 오래 걸림
https://chromium.googlesource.com/chromium/src/+/main/docs/mac_build_instructions.md

### run test
`autoninja -C out/Default blink_unittests`
이 명령어 굉장히 오래걸림 3~6 h

https://chromium.googlesource.com/chromium/src/+/main/docs/testing/testing_in_chromium.md#Run-gtest-locally

### recalc style

[[reacalculate style]]

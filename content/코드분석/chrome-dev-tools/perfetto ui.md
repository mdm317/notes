구글 오픈소스
The [Perfetto UI](https://ui.perfetto.dev/) enables you to view and analyze traces in the browser.
performace 탭으로 부족한 정보들도 option 을 조정하면 볼 수 있음

사용한 옵션
https://ui.perfetto.dev/#!/record/share/9e1ab24e040cc4372376b8ef2b90d3f7e1e6db47


## sql 사용가능


기본적인 단위는 slice 
https://perfetto.dev/docs/analysis/sql-tables#slice

`slice`,`_viz_slices_for_ui_table` 테이블로 조회 가능 

### 예시
### begrinFrame 조회
```sql
select *  from slice where name is 'BeginFrame' 
and utid is {utid} (optional)
```
![[Screenshot 2026-01-20 at 9.34.39 PM.png]]
일정 간격으로 호출됨
`and utid is {utid} (optional)` 다른 브라우저탭도 같이 조회되서 원하는 것만 보려면 추가해야한다.

### drawFrame
```sql
select *  from _viz_slices_for_ui_table as viz where name is 'drawFrame' 
and utid is {utid} (optional)

```
<p class="gray">
paint 이벤트 후에 호출됨
Commit 로 인해 발생하는것 처럼 보임
</p>









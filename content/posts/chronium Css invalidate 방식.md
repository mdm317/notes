
# Chromium은 스타일 재계산 대상을 어떻게 좁히는가  

DOM 요소의 class나 id 같은 attribute가 바뀌면 기존에 매칭되던 CSS selector가 더 이상 매칭되지 않거나 새로운 selector가 매칭될 수 있다. 이때 DOM 트리의 모든 요소에 대해 스타일을 다시 계산하면 비용이 크다.  

Blink는 스타일시트의 selector를 미리 분석해 invalidation 정보를 `RuleInvalidationData`에 저장한다. `RuleInvalidationData`는 class, id, attribute별로 관련 `InvalidationSet`을 인덱싱하며, class에 대한 정보는 `class_invalidation_sets`에 저장한다.  

~~~cpp
// rule_invalidation_data.h

using InvalidationSetMap =
    HashMap<AtomicString, scoped_refptr<InvalidationSet>>;
using InvalidationSetMap =
    HashMap<AtomicString, scoped_refptr<InvalidationSet>>;

using PseudoTypeInvalidationSetMap =
    HashMap<CSSSelector::PseudoType,
        scoped_refptr<InvalidationSet>,
        IntWithZeroKeyHashTraits<unsigned>>;

using ValuesInHasArgument = HashSet<AtomicString>;
using PseudosInHasArgument =
      HashSet<CSSSelector::PseudoType>;

InvalidationSetMap class_invalidation_sets;

~~~

`class_invalidation_sets`는 class 이름을 key로 사용하고, 해당 class가 변경됐을 때 필요한 `InvalidationSet`을 value로 저장하는 map이다.  

이 글에서는 여러 DOM mutation 중 class가 변경되는 경우만을 대상으로, Blink가 관련 `InvalidationSet`을 조회하고 요소를 invalidate하는 과정을 분석한다.  

## InvalidationSet  
### InvalidationSet Class  

InvalidationSetMap의 value는 DescendantInvalidationSet 또는 SiblingInvalidationSet을 참조한다.  

DescendantInvalidationSet, SiblingInvalidationSet은 InvalidationSet을 상속해서 만들어진다. 또한 `:nth-*` selector 처리를 위한 NthSiblingInvalidationSet은 SiblingInvalidationSet을 상속한다.  

~~~cpp
// invalidation_set.h
class DescendantInvalidationSet final : public InvalidationSet {
  // 별도의 추가 필드 없이 descendant 타입으로 사용
};

class SiblingInvalidationSet : public InvalidationSet {
};

class NthSiblingInvalidationSet final : public SiblingInvalidationSet {
};
~~~

### InvalidationSetMap의 저장 구조  

#### DescendantInvalidationSet  

~~~text
class_invalidation_sets[key]
└── scoped_refptr<InvalidationSet>
    └── DescendantInvalidationSet
~~~

예를 들어 `.parent .child`와 `.parent {}` selector가 함께 있으면  
다음처럼 저장될 수 있다.  

~~~text
class_invalidation_sets["parent"]
└── DescendantInvalidationSet
    ├── classes_: ["child"]
    └── InvalidatesSelf: true
~~~

self invalidation을 Bloom filter로 관리하는 경우에는  
`InvalidatesSelf` flag를 set에 저장하지 않을 수 있다.  
이때는 `parent`의 class hash가  
`names_with_self_invalidation`에 저장되고,  
`DescendantInvalidationSet`에는 `classes_: ["child"]`만 남을 수 있다.  

#### SiblingInvalidationSet  

~~~text
class_invalidation_sets[key]
└── scoped_refptr<InvalidationSet>
    └── SiblingInvalidationSet
~~~

예를 들어 `.parent + .child` selector는  
`parent`를 key로 하고, 형제 조건인 `child`를  
`SiblingInvalidationSet`에 저장한다.  

~~~text
class_invalidation_sets["parent"]
└── scoped_refptr<InvalidationSet>
    └── SiblingInvalidationSet
        ├── classes_: ["child"]
        ├── InvalidatesSelf: true
        └── max_direct_adjacent_selectors_: 1
~~~

`max_direct_adjacent_selectors_`는  
`SiblingInvalidationSet`의 적용 범위를 나타낸다.  
`.parent + .child`는 `1`, `.parent ~ .child`는  
모든 다음 sibling을 대상으로 하므로 `UINT_MAX`로 저장된다.  

여기서 `InvalidatesSelf`는 key인 `parent`가 아니라  
조건과 일치하는 형제 `child` 자체를 style recalc 대상으로 표시한다.  

`.parent {}`처럼 `parent` 자체를 무효화하는 selector가 함께 있으면,  
Bloom filter를 사용하지 않는 경우 self invalidation 정보가  
`SiblingInvalidationSet` 내부의 `Descendants()`에 결합될 수 있다.  

~~~text
class_invalidation_sets["parent"]
└── SiblingInvalidationSet
    ├── classes_: ["child"]
    ├── InvalidatesSelf: true
    └── Descendants()
        └── DescendantInvalidationSet
            └── InvalidatesSelf: true
~~~

Bloom filter를 사용하는 경우에는 이 self invalidation 정보가  
`Descendants()`에 저장되지 않고  
`names_with_self_invalidation`에 `parent`의 hash로 저장될 수 있다.  

## Invalidation 흐름  

class 변경으로 시작된 style invalidation은 다음 순서로 진행된다.  

~~~text
ClassChangedForElement
└── CollectInvalidationSetsForClass
    └── ScheduleInvalidationSetsForNode
        └── StyleInvalidator::Invalidate
~~~
### ClassChangedForElement  

변경된 class의 element 마다 InvalidationSet을 수집하고 element에 예약한다.  

~~~cpp
// third_party/blink/renderer/core/css/invalidation/rule_invalidation_data.cc

if (descendants) {
  invalidation_lists.descendants.push_back(descendants);
}
if (siblings) {
  invalidation_lists.siblings.push_back(siblings);
}
~~~

### ScheduleInvalidationSetsForNode  

수집한 set을 pending invalidation에 저장하고 node에 처리 필요 상태를 표시한다.  

~~~cpp
// third_party/blink/renderer/core/css/invalidation/pending_invalidations.cc
node.SetNeedsStyleInvalidation();
~~~

### StyleInvalidator::Invalidate(Document&)  

StyleInvalidator는 document root부터 DOM을 순회하면서 invalidate 를 검사  
~~~cpp
// third_party/blink/renderer/core/css/invalidation/style_invalidator.cc

void StyleInvalidator::Invalidate(Document& document,
                                   Element* root_element) {
  SiblingData sibling_data;

  if (document.NeedsStyleInvalidation()) {
    PushInvalidationSetsForContainerNode(document, sibling_data);
    document.ClearNeedsStyleInvalidation();
  }

  if (root_element) {
    Invalidate(*root_element, sibling_data);
  }

  pending_invalidation_map_.clear();
  pending_nth_sets_.clear();
~~~

#### DescendantInvalidationSet 처리  

해당 node의 하위 DOM을 순회하며 `DescendantInvalidationSet`과  
각 자손 element를 비교해 invalidate 대상인지 판단한다.  

위 예제에서는 `DescendantInvalidationSet`의 `classes_`에 저장된  
`child` class와 자손 element의 class가 일치하면 해당 element를  
style recalc 대상으로 표시한다.  

#### SiblingInvalidationSet 처리  

해당 node를 기준으로 `SiblingInvalidationSet`의 적용 범위를 계산하고  
범위 안의 형제 element가 invalidate 대상인지 판단한다.  

`SiblingInvalidationSet`의 조건과 형제 element가 일치하면  
해당 element를 style recalc 대상으로 표시한다.  

## 참고 자료  

https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/css/invalidation/invalidation_set.h  
https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/css/invalidation/rule_invalidation_data.cc  
https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/core/css/invalidation/style_invalidator.cc  
https://blogs.igalia.com/blee/posts/2023/05/31/how-blink-invalidates-styles-when-has-in-use.html  
https://docs.google.com/document/d/1vEW86DaeVs4uQzNFI5R-_xS9TcS1Cs_EUsHRSgCHGu8/view?tab=t.0  
https://www.youtube.com/watch?v=nWcexTnvIKI  
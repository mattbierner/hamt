# ChangeLog #

## 2.2.0 - January 30, 2016
* Added ` modifyValue` which takes a default value to invoke `f` with if no value exists. Thanks @dashed.
* Added `isMap` function to check if a value is a map.

## 2.1.1 - January 27, 2016
* Getting map size is now constant time.

## 2.1.0 - January 27, 2016
* Fixed edge case in remove when collapsing an ArrayNode.
* `hash` will attempt to use `toString` to convert values.
* Return same map for many noop mutations.
* Performance tuning.

## 2.0.1 - January 4, 2016
* Fixed `forEach`.

## 2.0.0 - January 4, 2016
Focusing on API compatibility with ES6 `Map` when possible.
* Lazily iterated over maps with `for (let [key, value] of map) { ... }`.
* Added `entries` which returns a Javascript iterators to key value pairs.
    * `pairs` which did the same but built an array has been removed.
* `keys` and `values` both now return Javascript iterators instead of arrays to match the `Map` API.
    * Use `Array.from` if you really need get an array.
* Swapped the order of `hamt.set` back to `hamt.set(key, value, map)`. Sorry :(
* Added `.size` property to maps.
* Added `hamt.forEach(f, map)` and `map.forEach(f)` where f is invoked with `(value, key, map)`

## 1.1.1 - January 3, 2016
* Perf improvements.

## 1.1.0 - January 3, 2016
* Restored `*hash` variants of functions that take a custom hash and key.
* Added `isEmpty` to check is a map contains any elements.
* Fixed an issue where lookups of undefined values on an array node would fail.
* Fixed `count` not working on array nodes properly.

## 1.0.0 - January 3, 2016
* Rewrite in ES6.
* Combined node and amd packages.
	* Both now live in the top level `hamt.js` and are generated from `lib/hamt.js`.
* Added chaining interface.
	* `hamt.empty.set('a', 1).set('b', 3)...`
* `hamt.get` returns undefined instead of `null` if lookup fails.
* Switched argument order on `hamt.modify` and `hamt.set` to better support binding.
	* Chain versions of these method have old argument order.
* Removed `*Hash` functions since these expose too many implementation details and can easily produce undesirable behavior if not used carefully.
* Changed `fold` to call `f` with `(accumulated, value, key)` instead of `(accumulated, {value, key})`.
* Aliased `map.delete` to `map.remove`.
* Performance improvements and internal cleanup.

## 0.1.9 - January 2, 2016
* Inline array update operations for better performances as suggested by @MichaelOstermann.

## 0.1.8 - September 27, 2014
* Fixed collision nodes on unexpanded branch not being expanded on insertions
  further down branch. Thanks raymond-w-ko for reporting this and providing test
  data.

## 0.1.7 - August 22, 2014
* Fix updates to collision list inserting value instead of Leaf nodes instead of
  into collision list.

## 0.1.6 - August 19, 2014
* Reverting `fold` to fix performance degradation.

## 0.1.5 - August 18, 2014
* Better `collision` update.

## 0.1.4 - April 10, 2014
* Performance improvement from recompiled with Khepri V0.23.0 for inlining.
* Stop iteration earlier on `expand`

## 0.1.3 - Feb 24, 2014
* Create fewer temp arrays for `IndexNode` alter.

## 0.1.2 - Feb 24, 2014
* Better collapsing of index nodes.
* ~1.2x performance boost overall.
	* Now faster than hashtrie.

## 0.1.1 - Feb 21, 2014
* ~15x boost to folds.
* Slightly faster gets and updates.

## 0.1.0 - Feb 20, 2014
* Feature complete with hashtrie V0.2.0

## 0.0.0 - Feb 18, 2014
* Initial release.

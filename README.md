<div align="center" >
    <img src="https://raw.githubusercontent.com/mattbierner/hamt/master/documentation/hamt-logo.png" alt="H.A.M.T." />
</div>

<p align="center">Javascript Hash Array Mapped Trie</p>

[![Build Status](https://travis-ci.org/mattbierner/hamt.svg?branch=master)](https://travis-ci.org/mattbierner/hamt)

### Overview
The [hash array mapped trie][hash-array-mapped-trie] is a [persistent][persistent] map data structure with good lookup and update performance. This library provides an immutable map with an API that resembles [ES6's `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

```javascript
var hamt = require('hamt');

// Keys can be any string and the map can store any value.
var h = hamt.empty
    .set('key', 'value')
    .set('object', { prop: 1 })
    .set('falsy', null);

h.size === 0
h.has('key') === true
h.has('falsy') === true
h.get('key') === 'value'

// Iteration
for (let [key, value] of h)
    console.log(key, value);

Array.from(h.values()) === [{ prop: 1 }, 'value', null];

// The data structure is fully immutable
var h2 = h.delete('key');
h2.get('key') === undefined
h.get('key') === 'value'
```

[Benchmarks][benchmarks] show that this library performs well, even as the size of the map becomes very large. [Check out Hamt+][hamt_plus] if you want support for additional features such as custom key types and transient mutation.

## Install
Source code is in `hamt.js` and generated from `lib/hamt.js`. The library supports node, AMD, and use as a global.

### Node
``` sh
$ npm install hamt
```

``` javascript
var hamt = require('hamt');

var h = hamt.empty.set('key', 'value');

...
```


### AMD
``` javascript
requirejs.config({
    paths: {
        'hamt': 'path/to/hamt/lib/hamt'
    }
});

require(['hamt'], function(hamt) {
    var h = hamt.empty.set('key', 'value');
    ...
});
```


# Usage
Hamt provides a method chaining interface and free functions for updating and querying the map. Both APIs provide identical functionality, but the free functions are designed for binding and composition, while the method chaining API is more legible and more Javascripty.

HAMTs are is persistent, so operations always return a modified copy of the map instead of alterting the original.

## Custom Hash Values
Most update and lookup methods have two versions: one that takes a key and uses an internal hash function to compute its hash, and a version that takes a custom computed hash value.


``` javascript
var h = hamt.empty.set('key', 'value');
var h2 = hamt.empty.setHash(5, 'key', 'value');


h.get('key') === 'value'
h2.getHash(5, 'key') === 'value'
```

If using a custom hash, you must only use the `*Hash` variant of functions to interact with the map.


``` javascript
// Because the internally computed hash of `key` is not `5`, a direct
// look will not work.
h2.get('key') === undefined

// You must use `getHash` with the same hash value originally passed in.
h2.getHash(5, 'key') === 'value'
```


## API
* [Basic](#basics) – Basic map operations.
* [Lookup](#lookup) – Looking up values in a map.
* [Modify](#modify) – Updating a map.
* [Iteration](#iteration) – Looping and folding over a map.

### Basics

#### `hamt.empty`
An empty map.

----

#### `hamt.isMap(value)`
Is `value` a map?

----

#### `hamt.isEmpty(map)`
#### `map.isEmpty()`
Is a map empty?

This is the correct method to check if a map is empty. Direct comparisons to `hamt.empty` will not work.

Returns `false` if `map` is not a map.

#### `hamt.count(map)`
#### `map.count()`
#### `map.size`
Get number of elements in `map`.

* `map` - Hamt map.


``` javascript
hamt.empty.count() === 0;
hamt.empty.set('a', 3).count() === 1;
hamt.empty.set('a', 3).set('b', 3).size === 2;
```

### Lookup

#### `hamt.get(key, map)`
#### `map.get(key)`
Lookup the value for `key` in `map`.

* `key` - String key.
* `map` - Hamt map.

``` javascript
var h = hamt.empty.set('key', 'value');

h.get('key') === 'value'
hamt.get('key', k) === 'value'

h.get('no such key') === undefined
```

----

#### `hamt.getHash(hash, key, map)`
#### `map.getHash(hash, key)`
Same as `get` but uses a custom hash value.

----

#### `hamt.tryGet(alt, key, map)`
#### `map.tryGet(alt, key)`
Same as `get` but returns `alt` if no value for `key` exists.

* `alt` - Value returned if no such key exists in the map.
* `key` - String key.
* `map` - Hamt map.

----

#### `hamt.has(key, map)`
#### `map.has(key)`
Does an entry for `key` exist in `map`?

* `key` - String key.
* `map` - Hamt map.

``` javascript
var h = hamt.empty.set('key', 'value');

h.has('key') === true
h.has('no such key') === false
```

----

#### `hamt.tryGetHash(alt, hash, key, map)`
#### `map.tryGetHash(alt, hash, key)`
Same as `tryGet` but uses a custom hash value.

----

#### `hamt.set(key, value, map)`
#### `map.set(key, value)`
Set the value for `key` in `map`.

* `value` - Value to store. Hamt supports all value types, including: literals, objects, falsy values, null, and undefined. Keep in mind that only the map data structure itself is guaranteed to be immutable. Using immutable values is recommended but not required.
* `key` - String key.
* `map` - Hamt map.

Returns a new map with the value set. Does not alter the original.

``` javascript
var h = hamt.empty
    .set('key', 'value');
    .set('key2', 'value2');

var h2 = h.set('key3', 'value3');

h2.get('key') === 'value'
h2.get('key2') === 'value2'
h2.get('key3') === 'value3'

// original `h` was not modified
h.get('key') === 'value'
h.get('key2') === 'value2'
h.get('key3') === undefined
```

----

#### `hamt.setHash(hash, key, value, map)`
#### `map.setHash(hash, key, value)`
Same as `set` but uses a custom hash value.

### Modify

#### `hamt.modify(f, key, map)`
#### `map.modify(key, f)`
Update the value stored for `key` in `map`.

* `f` - Function mapping current value to new value. If no current value exists, `f` is invoked with no arguments.
* `key` - String key.
* `map` - Hamt map.

Returns a new map with the modified value. Does not alter the original.

``` javascript
var h = hamt.empty
    .set('i', 2);

var h2 = h.modify('i', x => x * x);

h2.get('i') === 4
h.get('i') === 2
h2.count() === 1
h.count() === 1

// Operate on value that does not exist
var h3 = h.modify('new', x => {
    if (x === undefined) {
        return 10;
    }
    return -x;
});

h3.get('new') === 10
h3.count() === 2
```

----

#### `hamt.modifyHash(f, hash, key, map)`
#### `map.modifyHash(hash, key, f)`
Same as `modify` but uses a custom hash value.

----

#### `hamt.modifyValue(f, defaultValue, key, map)`
#### `map.modifyValue(key, f, defaultValue)`
Similar to `modify`, but invokes `f` with  `defaultValue` if no value exists in `map` for `key`.

----

#### `hamt.modifyValueHash(f, defaultValue, hash, key, map)`
#### `map.modifyValueHash(hash, key, f, defaultValue)`
Same as `modifyValue` but uses a custom hash value.

----

#### `hamt.remove(key, map)`
#### `map.remove(key)`
#### `map.delete(key)`
Remove `key` from `map`.

* `key` - String key.
* `map` - Hamt map.

Returns a new map with the value removed. Does not alter the original.

``` javascript
var h = hamt.empty
    .set('a', 1)
    .set('b', 2)
    .set('c', 3);

var h2 = h.remove('b');

h2.count() === 2;
h2.get('a') === 1
h2.get('b') === undefined
h2.get('c') === 3
```

----

#### `hamt.removeHash(hash, key, map)`
#### `map.removeHash(hash, key)`
#### `map.deleteHash(hash, key)`
Same as `remove` but uses a custom hash value.

----

### Iteration

#### `hamt.fold(f, z, map)`
#### `map.fold(f, z)`
Fold over the map, accumulating result value.

* `f` - Function invoked with accumulated value, current value, and current key.
* `z` - Initial value.
* `map` - Hamt map.

Order is not guaranteed.

``` javascript
var max = hamt.fold.bind(null,
    (acc, value, key) => Math.max(acc, value),
    0);

max(hamt.empty.set('key', 3).set('key', 4)) === 4;
```

----

#### `hamt.entries(map)`
#### `map.entries()`
Get a Javascript iterator to all key value pairs in `map`.

* `map` - Hamt map.

Order is not guaranteed.

``` javascript
Array.from(hamt.empty.entries()) === [];
Array.from(hamt.empty.set('a', 3).entries()) === [['a', 3]];
Array.from(hamt.empty.set('a', 3).set('b', 3).entries()) === [['a', 3], ['b', 3]];
```

You can also iterated directly over a map with ES6:

```javascript
const h = hamt.empty.set('a', 3).set('b', 3);

for (let [key, value] of h)
    ...

Array.from(h) === [['a', 3], ['b', 3]];
```

----

#### `hamt.key(map)`
#### `map.keys()`
Get a Javascript iterator to all keys in `map`.

* `map` - Hamt map.

Order is not guaranteed.

``` javascript
Array.from(hamt.empty.keys()) === [];
Array.from(hamt.empty.set('a', 3).keys()) === ['a'];
Array.from(hamt.empty.set('a', 3).set('b', 3).keys()) === ['a', 'b'];
```

----

#### `hamt.values(map)`
#### `map.values()`
Get a Javascript iterator to all values in `map`.

* `map` - Hamt map.

Order is not guaranteed. Duplicate entries may exist.

``` javascript
Array.from(hamt.empty.values()) === [];
Array.from(hamt.empty.set('a', 3).values()) === [3];
Array.from(hamt.empty.set('a', 3).values('b', 3).values()) === [3, 3];
```

----

#### `hamt.forEach(f, map)`
#### `map.forEach(f)`
Invoke function `f` for each value in the map.

* `f` - Function invoked with `(value, key, map)`.
* `map` - Hamt map.

Order is not guaranteed.


## Development
Any contributions to Hamt are welcome. Feel free to open an [issue](https://github.com/mattbierner/hamt/issues) if you run into problems or have a suggested improvement.

To develop Hamt, fork the repo and install the development node packages:

```bash
cd hamt
$ npm install
```

The source is written in ES6 and lives in `lib/hamt.js`. Gulp and Bable are used to translate the ES6 code to an ES5 distribution found in `hamt.js`. To start the compiler:

```bash
$ gulp default
```

Tests are written in Mocha and found in `tests\*`. To run the tests:

```js
$ mocha tests
```

## Credits
Code originally based on [exclipy's Haskell port][pdata].

[hamt_plus]: https://github.com/mattbierner/hamt_plus
[hashtrie]: https://github.com/mattbierner/hashtrie
[benchmarks]: http://github.com/mattbierner/js-hashtrie-benchmark
[pdata]: https://github.com/exclipy/pdata
[hash-array-mapped-trie]: http://en.wikipedia.org/wiki/Hash_array_mapped_trie
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure

[mori]: https://github.com/swannodette/mori
[persistent-hash-trie]: https://github.com/hughfdjackson/persistent-hash-trie

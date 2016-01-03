# HAMT
Javascript Hash Array Mapped Trie

### Overview
The [hash array mapped trie][hash-array-mapped-trie] is a [persistent][persistent]
map data structure with good lookup and update performance. This
Javascript implementation is based on [exclipy's Haskell port][pdata].

[Benchmarks show][benchmarks] against other Javascript hash trie implementations show
that this is the overall fastest persistent hash trie implementation for Javascript.

[HAMT+][hamt_plus] is a fork of this library with a nearly identical API, that
supports for transient mutation and custom key types. HAMT+ is [slightly slower][benchmarks]
for most operations however.


## Install
Source code is in `hamt.js` and generated from `lib/hamt.js`. The library supports node, AMD, and use as a global.

### Node
``` sh
$ npm install hamt
```

``` javascript
var hamt = require('hamt');

var h = hamt.empty.set('key', 'value', h);

...
```


### AMD
``` javascript
requirejs.config({
    paths: {
        'hamt': 'hamt'
    }
});

require(['hamt'], function(hamt) {
    var h = hamt.empty.set('key', 'value', h);
    ...
});
```


## API
Hamt provides a method chaining interface and a set of free functions to update and query map data structure. Both APIs provide identical functionality, byt the free functions use an argument order designed for binding and composition, while the method chaining api is more legible and more Javascripty.

The map is persistent, so operations always return a modified copy of the map instead of alterting the original.

#### `hamt.empty`
An empty map.

#### `hamt.get(key, map)`
#### `map.get(key, [alt])`
Lookup the value for `key` in `map`. 

* `key` - String key.
* `map` - Hamt map.

``` javascript
var h = hamt.empty.set('key', 'value');

h.get('key') === 'value'
hamt.get('key', k) === 'value'

h.get('no such key') === undefined
```

#### `hamt.tryGet(alt, key, map)`
#### `map.tryGet(key, alt)`
Same as `get` but returns `alt` if no value for `key` exists.

* `alt` - Value returned if no such key exists in the map.
* `key` - String key.
* `map` - Hamt map.

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

#### `hamt.set(value, key, map)`
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

#### `hamt.modify(f, key, map)`
#### `map.modify(key, f)`
Update the value stored for `key` in `map`. 

* `f` - Function mapping the current value to the new value. If no current value exists, the function is invoked with no arguments. 
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

#### `hamt.count(map)`
#### `map.count()`
Get number of elements in `map`.

* `map` - Hamt map.


``` javascript
hamt.empty.count() === 0;
hamt.empty.set('a', 3).count() === 1;
hamt.empty.set('a', 3).set('b', 3).count() === 2;
```

#### `hamt.fold(f, z, map)`
#### `map.fold(f, z)`
Fold over the map, accumulating result value.

* `f` - Function invoked with accumulated value, current value, and current key.
* `z` - Initial value.
* `map` - Hamt map.

Order is not guaranteed.

``` javascript
var max = hamt.fold.bind(null, (acc, value, key) =>
    Math.max(acc, value),
    0);

max(hamt.empty.set('key', 3).set('key', 4)) === 4;
```

#### `hamt.pairs(map)`
#### `map.pairs()`
Get an array of key value pairs in `map`.

* `map` - Hamt map.

Order is not guaranteed.

``` javascript
hamt.empty.pairs() === [];
hamt.empty.set('a', 3).pairs() === [['a', 3]];
hamt.empty.set('a', 3).set('b', 3).pairs() === [['a', 3], ['b', 3]];
```

#### `hamt.key(map)`
#### `map.keys()`
Get an array of all keys in `map`.

* `map` - Hamt map.

Order is not guaranteed.

``` javascript
hamt.empty.keys() === [];
hamt.empty.set('a', 3).keys() === ['a'];
hamt.empty.set('a', 3).set('b', 3).keys() === ['a', 'b'];
```

#### `hamt.values(map)`
#### `map.values()`
Get an array of all values in `map`.

* `map` - Hamt map.

Order is not guaranteed. Duplicate entries may exist.

``` javascript
hamt.empty.values() === [];
hamt.empty.set('a', 3).values() === [3];
hamt.empty.set('a', 3).values('b', 3).values() === [3, 3];
```


[hamt_plus]: https://github.com/mattbierner/hamt_plus
[hashtrie]: https://github.com/mattbierner/hashtrie
[benchmarks]: http://github.com/mattbierner/js-hashtrie-benchmark
[pdata]: https://github.com/exclipy/pdata
[hash-array-mapped-trie]: http://en.wikipedia.org/wiki/Hash_array_mapped_trie
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure

[mori]: https://github.com/swannodette/mori
[persistent-hash-trie]: https://github.com/hughfdjackson/persistent-hash-trie
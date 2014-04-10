# HAMT
Javascript Hash Array Mapped Trie

### Overview
The [hash array mapped trie][hash-array-mapped-trie] is a [persistent][persistent]
map data structure with good lookup and update performance. This
Javascript implementation is based on [exclipy's Haskell port][pdata].

[Benchmarks show][benchmarks] against [hashtrie][hashtrie],
[persistent-hash-trie][persistent-hash-trie], and [Mori's hashmap][mori] show
that this is the overall fastest persistent hash trie implementation.


## Install

### Node
Node source is in `dist_node/hamt.js`

```
$ npm install hamt
```

```
var hamt = require('hamt');

var h = hamt.empty;

h = hamt.set('key', 'value', h);

...
```


### Amd
Amd source is in `dist/hamt.js`

```
requirejs.config({
    paths: {
        'hamt': 'dist/hamt'
    }
});

require([
    'hamt'],
function(hamt) {
    ...
});
```


## Usage

```
var hamt = require('hamt');

// empty table
var h = hamt.empty;

// Set 'key' to 'value'
h = hamt.set('key', 'value', h);

// get 'key'
hamt.get('key', h); // 'value'


// The data structure is persistent so the original is not modified.
var h1 = hamt.set('a', 'x', hamt.empty);
var h2 = hamt.set('b', 'y', h1);

hamt.get('a', h1); // 'x'
hamt.get('b', h1); // null
hamt.get('a', h2); // 'x'
hamt.get('b', h2); // 'y'


// modify an entry
h2 = hamt.modify('b', function(x) { return x + 'z'; }, h2);
hamt.get('b', h2); // 'yz'

// remove an entry
h2 = hamt.remove('b', h2);
hamt.get('a', h2); // 'x'
hamt.get('b', h2); // null


// Custom hash Function
// The main Hamt API expects all keys to be strings. Versions of all API functions
// that take a `hash` parameter are also provided so custom hashes and keys can be used.

// Collisions are correctly handled
var h1 = hamt.setHash(0, 'a', 'x', hamt.empty);
var h2 = hamt.setHash(0, 'b', 'y', h1);

hamt.get('a', h2); // 'x'
hamt.get('b', h2); // 'y'

// Aggregate Info
var h = hamt.set('b', 'y', hamt.set('a', 'x', hamt.empty));

hamt.count(h); // 2
hamt.keys(h); // ['b', 'a'];
hamt.values(h); // ['y', 'x'];
hamt.pairs(h); // [['b', 'y'], ['a', 'x']];

// Fold
var h = hamt.set('a', 10, hamt.set('b', 4, hamt.set('c', -2, hamt.empty)));

hamt.fold(\p {value} -> p + value, h); // 12
```


[hashtrie]: https://github.com/mattbierner/hashtrie
[benchmarks]: http://github.com/mattbierner/js-hashtrie-benchmark
[pdata]: https://github.com/exclipy/pdata
[hash-array-mapped-trie]: http://en.wikipedia.org/wiki/Hash_array_mapped_trie
[persistent]: http://en.wikipedia.org/wiki/Persistent_data_structure

[mori]: https://github.com/swannodette/mori
[persistent-hash-trie]: https://github.com/hughfdjackson/persistent-hash-trie
'use strict';

/**
	@fileOverview Hash Array Mapped Trie.
	
	Code based on: https://github.com/exclipy/pdata
*/
var hamt = {};

var constant = function constant(x) {
    return function () {
        return x;
    };
};

/* Configuration
 ******************************************************************************/
var SIZE = 5;

var BUCKET_SIZE = Math.pow(2, SIZE);

var MASK = BUCKET_SIZE - 1;

var MAX_INDEX_NODE = BUCKET_SIZE / 2;

var MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/* Nothing
 ******************************************************************************/
var nothing = {};

/* Bit Ops
 ******************************************************************************/
/**
	Hamming weight.
	
	Taken from: http://jsperf.com/hamming-weight
*/
var popcount = function popcount(x) {
    x -= x >> 1 & 0x55555555;
    x = (x & 0x33333333) + (x >> 2 & 0x33333333);
    x = x + (x >> 4) & 0x0f0f0f0f;
    x += x >> 8;
    x += x >> 16;
    return x & 0x7f;
};

var hashFragment = function hashFragment(shift, h) {
    return h >>> shift & MASK;
};

var toBitmap = function toBitmap(x) {
    return 1 << x;
};

var fromBitmap = function fromBitmap(bitmap, bit) {
    return popcount(bitmap & bit - 1);
};

/* Array Ops
 ******************************************************************************/
/**
	Set a value in an array.
	
	@param at Index to change.
	@param v New value
	@param arr Array.
*/
var arrayUpdate = function arrayUpdate(at, v, arr) {
    var len = arr.length;
    var out = new Array(len);
    for (var i = 0; i < len; ++i) {
        out[i] = arr[i];
    }out[at] = v;
    return out;
};

/**
	Remove a value from an array.
	
	@param at Index to remove.
	@param arr Array.
*/
var arraySpliceOut = function arraySpliceOut(at, arr) {
    var len = arr.length;
    var out = new Array(len - 1);
    var i = 0,
        g = 0;
    while (i < at) {
        out[g++] = arr[i++];
    }++i;
    while (i < len) {
        out[g++] = arr[i++];
    }return out;
};

/**
	Insert a value into an array.
	
	@param at Index to insert at.
	@param v Value to insert,
	@param arr Array.
*/
var arraySpliceIn = function arraySpliceIn(at, v, arr) {
    var len = arr.length;
    var out = new Array(len + 1);
    var i = 0;
    var g = 0;
    while (i < at) {
        out[g++] = arr[i++];
    }out[g++] = v;
    while (i < len) {
        out[g++] = arr[i++];
    }return out;
};

/* 
 ******************************************************************************/
/**
	Get 32 bit hash of string.
	
	Based on:
	http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
var hash = hamt.hash = function (str) {
    if (typeof str === 'number') return str;

    var hash = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c | 0;
    }
    return hash;
};

/* Node Structures
 ******************************************************************************/
var LEAF = 1;
var COLLISION = 2;
var INDEX = 3;
var ARRAY = 4;

/**
	Empty node.
*/
var empty = { __hamt_isEmpty: true };

var isEmptyNode = function isEmptyNode(x) {
    return x === empty || x && x.__hamt_isEmpty;
};

/**
	Leaf holding a value.
	
	@member hash Hash of key.
	@member key Key.
	@member value Value stored.
*/
function Leaf(hash, key, value) {
    this.type = LEAF;
    this.hash = hash;
    this.key = key;
    this.value = value;
};

/**
	Leaf holding multiple values with the same hash but different keys.
	
	@member hash Hash of key.
	@member children Array of collision children node.
*/
function Collision(hash, children) {
    this.type = COLLISION;
    this.hash = hash;
    this.children = children;
};

/**
	Internal node with a sparse set of children.
	
	Uses a bitmap and array to pack children.
	
	@member mask Bitmap that encode the positions of children in the array.
	@member children Array of child nodes.
*/
function IndexedNode(mask, children) {
    this.type = INDEX;
    this.mask = mask;
    this.children = children;
};

/**
	Internal node with many children.
	
	@member size Number of children.
	@member children Array of child nodes.
*/
function ArrayNode(size, children) {
    this.type = ARRAY;
    this.size = size;
    this.children = children;
};

/**
	Is `node` a leaf node?
*/
var isLeaf = function isLeaf(node) {
    return node === empty || node.type === LEAF || node.type === COLLISION;
};

/* Internal node operations.
 ******************************************************************************/
/**
	Expand an indexed node into an array node.
	
	@param frag Index of added child.
	@param child Added child.
	@param mask Index node mask before child added.
	@param subNodes Index node children before child added.
*/
var expand = function expand(frag, child, bitmap, subNodes) {
    var arr = [];

    var bit = bitmap;
    var count = 0;
    for (var i = 0; bit; ++i) {
        if (bit & 1) arr[i] = subNodes[count++];
        bit >>>= 1;
    }
    arr[frag] = child;
    return new ArrayNode(count + 1, arr);
};

/**
	Collapse an array node into a indexed node.
*/
var pack = function pack(count, removed, elements) {
    var children = new Array(count - 1);
    var g = 0;
    var bitmap = 0;
    for (var i = 0, len = elements.length; i < len; ++i) {
        var elem = elements[i];
        if (i !== removed && !isEmptyNode(elem)) {
            children[g++] = elem;
            bitmap |= 1 << i;
        }
    }
    return new IndexedNode(bitmap, children);
};

/**
	Merge two leaf nodes.
	
	@param shift Current shift.
	@param h1 Node 1 hash.
	@param n1 Node 1.
	@param h2 Node 2 hash.
	@param n2 Node 2.
*/
var mergeLeaves = function mergeLeaves(shift, h1, n1, h2, n2) {
    if (h1 === h2) return new Collision(h1, [n2, n1]);

    var subH1 = hashFragment(shift, h1);
    var subH2 = hashFragment(shift, h2);
    return new IndexedNode(toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
    Update an entry in a collision list.

    @param hash Hash of collision.
    @param list Collision list.
    @param f Update function.
    @param k Key to update.
*/
var updateCollisionList = function updateCollisionList(h, list, f, k) {
    var target = undefined;
    var i = 0;
    for (var len = list.length; i < len; ++i) {
        var child = list[i];
        if (child.key === k) {
            target = child;
            break;
        }
    }

    var v = target ? f(target.value) : f();
    return v === nothing ? arraySpliceOut(i, list) : arrayUpdate(i, new Leaf(h, k, v), list);
};

/* Lookups
 ******************************************************************************/
var _lookup = function _lookup(node, h, k) {
    var shift = 0;
    while (true) {
        switch (node.type) {
            case LEAF:
                {
                    return k === node.key ? node.value : nothing;
                }
            case COLLISION:
                {
                    if (h === node.hash) {
                        var children = node.children;
                        for (var i = 0, len = children.length; i < len; ++i) {
                            var child = children[i];
                            if (k === child.key) return child.value;
                        }
                    }
                    return nothing;
                }
            case INDEX:
                {
                    var frag = hashFragment(shift, h);
                    var bit = toBitmap(frag);
                    if (node.mask & bit) {
                        node = node.children[fromBitmap(node.mask, bit)];
                        shift += SIZE;
                        break;
                    } else {
                        return nothing;
                    }
                }
            case ARRAY:
                {
                    node = node.children[hashFragment(shift, h)];
                    if (node) {
                        shift += SIZE;
                        break;
                    } else {
                        return nothing;
                    }
                }
            default:
                return nothing;
        }
    }
};

/* Editing
 ******************************************************************************/
Leaf.prototype._modify = function (shift, f, h, k) {
    if (k === this.key) {
        var _v = f(this.value);
        return _v === nothing ? empty : new Leaf(h, k, _v);
    }
    var v = f();
    return v === nothing ? this : mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

Collision.prototype._modify = function (shift, f, h, k) {
    if (h === this.hash) {
        var list = updateCollisionList(this.hash, this.children, f, k);
        return list.length > 1 ? new Collision(this.hash, list) : list[0]; // collapse single element collision list
    }
    var v = f();
    return v === nothing ? this : mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

IndexedNode.prototype._modify = function (shift, f, h, k) {
    var mask = this.mask;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    var indx = fromBitmap(mask, bit);
    var exists = mask & bit;
    var current = exists ? children[indx] : empty;
    var child = current._modify(shift + SIZE, f, h, k);

    if (exists && isEmptyNode(child)) {
        // remove
        var bitmap = mask & ~bit;
        if (!bitmap) return empty;
        return children.length <= 2 && isLeaf(children[indx ^ 1]) ? children[indx ^ 1] // collapse
        : new IndexedNode(bitmap, arraySpliceOut(indx, children));
    }
    if (!exists && !isEmptyNode(child)) {
        // add
        return children.length >= MAX_INDEX_NODE ? expand(frag, child, mask, children) : new IndexedNode(mask | bit, arraySpliceIn(indx, child, children));
    }

    // modify
    return current === child ? this : new IndexedNode(mask, arrayUpdate(indx, child, children));
};

ArrayNode.prototype._modify = function (shift, f, h, k) {
    var count = this.size;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var child = children[frag];
    var newChild = (child || empty)._modify(shift + SIZE, f, h, k);

    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
        // add
        return new ArrayNode(count + 1, arrayUpdate(frag, newChild, children));
    }
    if (!isEmptyNode(child) && isEmptyNode(newChild)) {
        // remove
        return count - 1 <= MIN_ARRAY_NODE ? pack(count, frag, children) : new ArrayNode(count - 1, arrayUpdate(frag, empty, children));
    }

    // modify
    return child === newChild ? this : new ArrayNode(count, arrayUpdate(frag, newChild, children));
};

empty._modify = function (_, f, h, k) {
    var v = f();
    return v === nothing ? empty : new Leaf(h, k, v);
};

/*
 ******************************************************************************/
function Map(root) {
    this.root = root;
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.
    
    Returns the value or `alt` if none.
*/
var tryGetHash = hamt.tryGetHash = function (alt, hash, key, map) {
    var v = _lookup(map.root, hash, key);
    return v === nothing ? alt : v;
};

Map.prototype.tryGetHash = function (alt, hash, key) {
    return tryGetHash(alt, hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.
    
    @see `tryGetHash`
*/
var tryGet = hamt.tryGet = function (alt, key, map) {
    return tryGetHash(alt, hash(key), key, map);
};

Map.prototype.tryGet = function (alt, key) {
    return tryGet(alt, key, this);
};

/**
    Lookup the value for `key` in `map` using a custom `hash`.
    
    Returns the value or `undefined` if none.
*/
var getHash = hamt.getHash = function (hash, key, map) {
    return tryGetHash(undefined, hash, key, map);
};

Map.prototype.getHash = function (hash, key) {
    return getHash(hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.
    
    @see `get`
*/
var get = hamt.get = function (key, map) {
    return tryGet(undefined, key, map);
};

Map.prototype.get = function (key, alt) {
    return tryGet(alt, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
var hasHash = hamt.has = function (hash, key, map) {
    return tryGetHash(nothing, hash, key, map) !== nothing;
};

Map.prototype.hasHash = function (hash, key) {
    return hasHash(hash, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses internal hash function.
*/
var has = hamt.has = function (key, map) {
    return hasHash(hash(key), key, map);
};

Map.prototype.has = function (key) {
    return has(key, this);
};

/**
    Empty node.
*/
hamt.empty = new Map(empty);

/**
    Does `map` contain any elements?
*/
var isEmpty = hamt.isEmpty = function (map) {
    return !!isEmptyNode(map.root);
};

Map.prototype.isEmpty = function () {
    return isEmpty(this);
};

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f` using
    custom hash.
    
    `f` is invoked with the current value for `k` if it exists,
    or no arguments if no such value exists. `modify` will always either
    update or insert a value into the map.
    
    Returns a map with the modified value. Does not alter `map`.
*/
var modifyHash = hamt.modifyHash = function (f, hash, key, map) {
    return new Map(map.root._modify(0, f, hash, key));
};

Map.prototype.modifyHash = function (hash, key, f) {
    return modifyHash(f, hash, key, this);
};

/**
    Alter the value stored for `key` in `map` using function `f` using 
    internal hash function.
    
    @see `modifyHash`
*/
var modify = hamt.modify = function (f, key, map) {
    return modifyHash(f, hash(key), key, map);
};

Map.prototype.modify = function (key, f) {
    return modify(f, key, this);
};

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
var setHash = hamt.setHash = function (hash, key, value, map) {
    return modifyHash(constant(value), hash, key, map);
};

Map.prototype.setHash = function (hash, key, value) {
    return setHash(hash, key, value, this);
};

/**
    Store `value` for `key` in `map` using internal hash function.
      
    @see `setHash`
*/
var set = hamt.set = function (key, value, map) {
    return setHash(hash(key), key, value, map);
};

Map.prototype.set = function (key, value) {
    return set(key, value, this);
};

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
var del = constant(nothing);
var removeHash = hamt.removeHash = function (hash, key, map) {
    return modifyHash(del, hash, key, map);
};

Map.prototype.removeHash = Map.prototype.deleteHash = function (hash, key) {
    return removeHash(hash, key, this);
};

/**
    Remove the entry for `key` in `map` using internal hash function.
    
    @see `removeHash`
*/
var remove = hamt.remove = function (key, map) {
    return removeHash(hash(key), key, map);
};

Map.prototype.remove = Map.prototype.delete = function (key) {
    return remove(key, this);
};

/* Traversal
 ******************************************************************************/
var appk = function appk(k) {
    return k && lazyVisitChildren(k[0], k[1], k[2], k[3], k[4]);
};

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
var lazyVisitChildren = function lazyVisitChildren(len, children, i, f, k) {
    while (i < len) {
        var child = children[i++];
        if (child && !isEmptyNode(child)) return lazyVisit(child, f, [len, children, i, f, k]);
    }
    return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
var lazyVisit = function lazyVisit(node, f, k) {
    switch (node.type) {
        case LEAF:
            return { value: f(node), rest: k };

        case COLLISION:
        case ARRAY:
        case INDEX:
            var children = node.children;
            return lazyVisitChildren(children.length, children, 0, f, k);

        default:
            return appk(k);
    }
};

var DONE = { done: true };

function MapIterator(v) {
    this.v = v;
};

MapIterator.prototype.next = function () {
    if (!this.v) return DONE;
    var v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
};

MapIterator.prototype[Symbol.iterator] = function () {
    return this;
};

var visit = function visit(map, f) {
    return new MapIterator(lazyVisit(map.root, f));
};

/**
    Get a Javascsript iterator of `map`.
    
    Iterates over `[key, value]` arrays.
*/
var buildPairs = function buildPairs(x) {
    return [x.key, x.value];
};
var entries = hamt.entries = function (map) {
    return visit(map, buildPairs);
};

Map.prototype.entries = Map.prototype[Symbol.iterator] = function () {
    return entries(this);
};

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
var buildKeys = function buildKeys(x) {
    return x.key;
};
var keys = hamt.keys = function (map) {
    return visit(map, buildKeys);
};

Map.prototype.keys = function () {
    return keys(this);
};

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
var buildValues = function buildValues(x) {
    return x.value;
};
var values = hamt.values = Map.prototype.values = function (map) {
    return visit(map, buildValues);
};

Map.prototype.values = function () {
    return values(this);
};

/* Fold
 ******************************************************************************/
Leaf.prototype._fold = function (f, z) {
    return f(z, this.value, this.key);
};

empty._fold = function (f, z) {
    return z;
};

Collision.prototype._fold = IndexedNode.prototype._fold = function (f, z) {
    var children = this.children;
    for (var i = 0, len = children.length; i < len; ++i) {
        var c = children[i];
        z = c.type === LEAF ? f(z, c.value, c.key) : c._fold(f, z);
    }
    return z;
};

ArrayNode.prototype._fold = function (f, z) {
    var children = this.children;
    for (var i = 0, len = children.length; i < len; ++i) {
        var c = children[i];
        if (c && !isEmptyNode(c)) z = c.type === LEAF ? f(z, c.value, c.key) : c._fold(f, z);
    }
    return z;
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.
    
    @param f Function mapping accumulated value, value, and key to new value.
    @param z Starting value.
    @param m HAMT
*/
var fold = hamt.fold = function (f, z, m) {
    return m.root._fold(f, z);
};

Map.prototype.fold = function (f, z) {
    return fold(f, z, this);
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.
    
    @param f Function invoked with value and key
    @param map HAMT
*/
var forEach = hamt.forEach = function (f, map) {
    return fold(function (_, value, key) {
        return f(value, key, map);
    }, null, map);
};

Map.prototype.forEach = function (f) {
    return forEach(f, this);
};

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
var inc = function inc(x) {
    return x + 1;
};
var count = hamt.count = function (map) {
    return fold(inc, 0, map);
};

Map.prototype.count = function () {
    return count(this);
};

Object.defineProperty(Map.prototype, 'size', {
    get: Map.prototype.count
});

/* Export
 ******************************************************************************/
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hamt;
} else if (typeof define === 'function' && define.amd) {
    define('hamt', [], function () {
        return hamt;
    });
} else {
    undefined.hamt = hamt;
}
//# sourceMappingURL=hamt.js.map

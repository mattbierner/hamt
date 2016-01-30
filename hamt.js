'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/**
	@fileOverview Hash Array Mapped Trie.

	Code based on: https://github.com/exclipy/pdata
*/
var hamt = {}; // export

/* Configuration
 ******************************************************************************/
var SIZE = 5;

var BUCKET_SIZE = Math.pow(2, SIZE);

var MASK = BUCKET_SIZE - 1;

var MAX_INDEX_NODE = BUCKET_SIZE / 2;

var MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
var nothing = {};

var constant = function constant(x) {
    return function () {
        return x;
    };
};

var defaultValBind = function defaultValBind(f, defaultValue) {
    return function (x) {
        return f(arguments.length === 0 ? defaultValue : x);
    };
};

/**
	Get 32 bit hash of string.

	Based on:
	http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
var hash = hamt.hash = function (str) {
    var type = typeof str === 'undefined' ? 'undefined' : _typeof(str);
    if (type === 'number') return str;
    if (type !== 'string') str += '';

    var hash = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c | 0;
    }
    return hash;
};

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
    var i = 0,
        g = 0;
    while (i < at) {
        out[g++] = arr[i++];
    }out[g++] = v;
    while (i < len) {
        out[g++] = arr[i++];
    }return out;
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
var Leaf = function Leaf(hash, key, value) {
    return {
        type: LEAF,
        hash: hash,
        key: key,
        value: value,
        _modify: Leaf__modify
    };
};

/**
	Leaf holding multiple values with the same hash but different keys.

	@member hash Hash of key.
	@member children Array of collision children node.
*/
var Collision = function Collision(hash, children) {
    return {
        type: COLLISION,
        hash: hash,
        children: children,
        _modify: Collision__modify
    };
};

/**
	Internal node with a sparse set of children.

	Uses a bitmap and array to pack children.

	@member mask Bitmap that encode the positions of children in the array.
	@member children Array of child nodes.
*/
var IndexedNode = function IndexedNode(mask, children) {
    return {
        type: INDEX,
        mask: mask,
        children: children,
        _modify: IndexedNode__modify
    };
};

/**
	Internal node with many children.

	@member size Number of children.
	@member children Array of child nodes.
*/
var ArrayNode = function ArrayNode(size, children) {
    return {
        type: ARRAY,
        size: size,
        children: children,
        _modify: ArrayNode__modify
    };
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
    return ArrayNode(count + 1, arr);
};

/**
	Collapse an array node into a indexed node.

	@param count Number of elements in new array.
	@param removed Index of removed element.
	@param elements Array node children before remove.
*/
var pack = function pack(count, removed, elements) {
    var children = new Array(count - 1);
    var g = 0;
    var bitmap = 0;
    for (var i = 0, len = elements.length; i < len; ++i) {
        if (i !== removed) {
            var elem = elements[i];
            if (elem && !isEmptyNode(elem)) {
                children[g++] = elem;
                bitmap |= 1 << i;
            }
        }
    }
    return IndexedNode(bitmap, children);
};

/**
	Merge two leaf nodes.

	@param h1 Node 1 hash.
	@param n1 Node 1.
	@param h2 Node 2 hash.
	@param n2 Node 2.
*/
var mergeLeaves = function mergeLeaves(h1, n1, h2, n2) {
    if (h1 === h2) return Collision(h1, [n2, n1]);

    var subH1 = h1 & MASK;
    var subH2 = h2 & MASK;
    return IndexedNode(toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(h1 >>> SIZE, n1, h2 >>> SIZE, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
    Update an entry in a collision list.

    @param hash Hash of collision.
    @param list Collision list.
    @param f Update function.
    @param k Key to update.
    @param size Size reference
*/
var updateCollisionList = function updateCollisionList(h, list, f, k, size) {
    var len = list.length;
    for (var i = 0; i < len; ++i) {
        var child = list[i];
        if (child.key === k) {
            var value = child.value;
            var _newValue = f(value);
            if (_newValue === value) return list;

            if (_newValue === nothing) {
                --size.value;
                return arraySpliceOut(i, list);
            }
            return arrayUpdate(i, Leaf(h, k, _newValue), list);
        }
    }

    var newValue = f();
    if (newValue === nothing) return list;
    ++size.value;
    return arrayUpdate(len, Leaf(h, k, newValue), list);
};

/* Editing
 ******************************************************************************/
var Leaf__modify = function Leaf__modify(shift, f, h, k, size) {
    if (k === this.key) {
        var _v = f(this.value);
        if (_v === this.value) return this;
        if (_v === nothing) {
            --size.value;
            return empty;
        }
        return Leaf(h, k, _v);
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(this.hash >>> shift, this, h >>> shift, Leaf(h, k, v));
};

var Collision__modify = function Collision__modify(shift, f, h, k, size) {
    if (h === this.hash) {
        var list = updateCollisionList(this.hash, this.children, f, k, size);
        if (list === this.children) return this;

        return list.length > 1 ? Collision(this.hash, list) : list[0]; // collapse single element collision list
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(this.hash >>> shift, this, h >>> shift, Leaf(h, k, v));
};

var IndexedNode__modify = function IndexedNode__modify(shift, f, h, k, size) {
    var mask = this.mask;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    var indx = fromBitmap(mask, bit);
    var exists = mask & bit;
    var current = exists ? children[indx] : empty;
    var child = current._modify(shift + SIZE, f, h, k, size);

    if (current === child) return this;

    if (exists && isEmptyNode(child)) {
        // remove
        var bitmap = mask & ~bit;
        if (!bitmap) return empty;
        return children.length <= 2 && isLeaf(children[indx ^ 1]) ? children[indx ^ 1] // collapse
        : IndexedNode(bitmap, arraySpliceOut(indx, children));
    }
    if (!exists && !isEmptyNode(child)) {
        // add
        return children.length >= MAX_INDEX_NODE ? expand(frag, child, mask, children) : IndexedNode(mask | bit, arraySpliceIn(indx, child, children));
    }

    // modify
    return IndexedNode(mask, arrayUpdate(indx, child, children));
};

var ArrayNode__modify = function ArrayNode__modify(shift, f, h, k, size) {
    var count = this.size;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var child = children[frag];
    var newChild = (child || empty)._modify(shift + SIZE, f, h, k, size);

    if (child === newChild) return this;

    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
        // add
        return ArrayNode(count + 1, arrayUpdate(frag, newChild, children));
    }
    if (!isEmptyNode(child) && isEmptyNode(newChild)) {
        // remove
        return count - 1 <= MIN_ARRAY_NODE ? pack(count, frag, children) : ArrayNode(count - 1, arrayUpdate(frag, empty, children));
    }

    // modify
    return ArrayNode(count, arrayUpdate(frag, newChild, children));
};

empty._modify = function (_, f, h, k, size) {
    var v = f();
    if (v === nothing) return empty;
    ++size.value;
    return Leaf(h, k, v);
};

/*
 ******************************************************************************/
function Map(root, size) {
    this._root = root;
    this._size = size;
};

Map.prototype.setTree = function (root, size) {
    return root === this._root ? this : new Map(root, size);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
var tryGetHash = hamt.tryGetHash = function (alt, hash, key, map) {
    var node = map._root;
    var shift = 0;
    while (true) {
        switch (node.type) {
            case LEAF:
                {
                    return key === node.key ? node.value : alt;
                }
            case COLLISION:
                {
                    if (hash === node.hash) {
                        var children = node.children;
                        for (var i = 0, len = children.length; i < len; ++i) {
                            var child = children[i];
                            if (key === child.key) return child.value;
                        }
                    }
                    return alt;
                }
            case INDEX:
                {
                    var frag = hashFragment(shift, hash);
                    var bit = toBitmap(frag);
                    if (node.mask & bit) {
                        node = node.children[fromBitmap(node.mask, bit)];
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            case ARRAY:
                {
                    node = node.children[hashFragment(shift, hash)];
                    if (node) {
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            default:
                return alt;
        }
    }
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
    return tryGetHash(undefined, hash(key), key, map);
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
hamt.empty = new Map(empty, 0);

/**
    Does `map` contain any elements?
*/
var isEmpty = hamt.isEmpty = function (map) {
    return !!isEmptyNode(map._root);
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
    or `defaultValue` if it is specified. Otherwise, `f` is invoked with no arguments
    if no such value exists.

    `modify` will always either update or insert a value into the map.

    Returns a map with the modified value. Does not alter `map`.
*/
var modifyHash = hamt.modifyHash = function (f, hash, key, map) {
    var size = { value: map._size };
    var newRoot = map._root._modify(0, f, hash, key, size);
    return map.setTree(newRoot, size.value);
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
    Same as `modifyHash`, but invokes `f` with `defaultValue` if no entry exists.

    @see `modifyHash`
*/
var modifyValueHash = hamt.modifyValueHash = function (f, defaultValue, hash, key, map) {
    return modifyHash(defaultValBind(f, defaultValue), hash, key, map);
};

Map.prototype.modifyValueHash = function (hash, key, f, defaultValue) {
    return modifyValueHash(f, defaultValue, hash, key, this);
};

/**
    @see `modifyValueHash`
*/
var modifyValue = hamt.modifyValue = function (f, defaultValue, key, map) {
    return modifyValueHash(f, defaultValue, hash(key), key, map);
};

Map.prototype.modifyValue = function (key, f, defaultValue) {
    return modifyValue(f, defaultValue, key, this);
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
/**
    Apply a continuation.
*/
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

/**
    Javascript iterator over a map.
*/
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

/**
    Lazily visit each value in map with function `f`.
*/
var visit = function visit(map, f) {
    return new MapIterator(lazyVisit(map._root, f));
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
/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function mapping accumulated value, value, and key to new value.
    @param z Starting value.
    @param m HAMT
*/
var fold = hamt.fold = function (f, z, m) {
    var root = m._root;
    if (root.type === LEAF) return f(z, root.value, root.key);

    var toVisit = [root.children];
    var children = undefined;
    while (children = toVisit.pop()) {
        for (var i = 0, len = children.length; i < len;) {
            var child = children[i++];
            if (child && child.type) {
                if (child.type === LEAF) z = f(z, child.value, child.key);else toVisit.push(child.children);
            }
        }
    }
    return z;
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
var count = hamt.count = function (map) {
    return map._size;
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

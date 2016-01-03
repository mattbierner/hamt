'use strict';

/**
 * @fileOverview Hash Array Mapped Trie.
 * 
 * Code based on: https://github.com/exclipy/pdata
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

var mask = BUCKET_SIZE - 1;

var MAX_INDEX_NODE = BUCKET_SIZE / 2;

var MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/* Nothing
 ******************************************************************************/
var nothing = {};

var isNothing = function isNothing(x) {
    return x === nothing;
};

var maybe = function maybe(val, def) {
    return isNothing(val) ? def : val;
};

/* Bit Ops
 ******************************************************************************/
/**
 * Hamming weight.
 * 
 * Taken from: http://jsperf.com/hamming-weight
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
    return h >>> shift & mask;
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
 * Set a value in an array.
 * 
 * @param at Index to change.
 * @param v New value
 * @param arr Array.
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
 * Remove a value from an array.
 * 
 * @param at Index to remove.
 * @param arr Array.
 */
var arraySpliceOut = function arraySpliceOut(at, arr) {
    var len = arr.length;
    var out = new Array(len - 1);
    var i = 0;
    for (; i < at; ++i) {
        out[i] = arr[i];
    }++i;
    for (; i < len; ++i) {
        out[i - 1] = arr[i];
    }return out;
};

/**
 * Insert a value into an array.
 * 
 * @param at Index to insert at.
 * @param v Value to insert,
 * @param arr Array.
 */
var arraySpliceIn = function arraySpliceIn(at, v, arr) {
    var len = arr.length;
    var out = new Array(len + 1);
    var i = 0;
    for (; i < at; ++i) {
        out[i] = arr[i];
    }out[i] = v;
    for (; i < len; ++i) {
        out[i + 1] = arr[i];
    }return out;
};

/* 
 ******************************************************************************/
/**
 * Get 32 bit hash of string.
 * 
 * Based on:
 * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
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
/**
 * Empty node.
 */
var empty = { __hamt_isEmpty: true };
hamt.empty = empty;

/**
 * Leaf holding a value.
 * 
 * @member hash Hash of key.
 * @member key Key.
 * @member value Value stored.
 */
var Leaf = function Leaf(hash, key, value) {
    this.hash = hash;
    this.key = key;
    this.value = value;
};

/**
 * Leaf holding multiple values with the same hash but different keys.
 * 
 * @member hash Hash of key.
 * @member children Array of collision children node.
 */
var Collision = function Collision(hash, children) {
    this.hash = hash;
    this.children = children;
};

/**
 * Internal node with a sparse set of children.
 * 
 * Uses a bitmap and array to pack children.
 * 
 * @member mask Bitmap that encode the positions of children in the array.
 * @member children Array of child nodes.
 */
var IndexedNode = function IndexedNode(mask, children) {
    this.mask = mask;
    this.children = children;
};

/**
 * Internal node with many children.
 * 
 * @member count Number of children.
 * @member children Array of child nodes.
 */
var ArrayNode = function ArrayNode(count, children) {
    this.count = count;
    this.children = children;
};

/* 
 ******************************************************************************/
var isEmpty = function isEmpty(x) {
    return !x || x === empty || x && x.__hamt_isEmpty;
};

/**
 * Is `node` a leaf node?
 */
var isLeaf = function isLeaf(node) {
    return node === empty || node instanceof Leaf || node instanceof Collision;
};

/**
 * Expand an indexed node into an array node.
 * 
 * @param frag Index of added child.
 * @param child Added child.
 * @param mask Index node mask before child added.
 * @param subNodes Index node children before child added.
 */
var expand = function expand(frag, child, bitmap, subNodes) {
    var bit = bitmap;
    var arr = [];
    var count = 0;
    for (var i = 0; bit; ++i) {
        if (bit & 1) {
            arr[i] = subNodes[count];
            ++count;
        }
        bit = bit >>> 1;
    }
    arr[frag] = child;
    return new ArrayNode(count + 1, arr);
};

/**
 * Collapse an array node into a indexed node.
 */
var pack = function pack(removed, elements) {
    var children = [];
    var bitmap = 0;

    for (var i = 0, len = elements.length; i < len; ++i) {
        var elem = elements[i];
        if (i !== removed && !isEmpty(elem)) {
            children.push(elem);
            bitmap |= 1 << i;
        }
    }
    return new IndexedNode(bitmap, children);
};

/**
 * Merge two leaf nodes.
 * 
 * @param shift Current shift.
 * @param n1 Node.
 * @param n2 Node.
 */
var mergeLeaves = function mergeLeaves(shift, h1, n1, h2, n2) {
    if (h1 === h2) return new Collision(h1, [n2, n1]);

    var subH1 = hashFragment(shift, h1);
    var subH2 = hashFragment(shift, h2);
    return new IndexedNode(toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
 * Update an entry in a collision list.
 * 
 * @param hash Hash of collision.
 * @param list Collision list.
 * @param f Update function.
 * @param k Key to update.
 */
var updateCollisionList = function updateCollisionList(h, list, f, k) {
    var target,
        i = 0;
    for (var len = list.length; i < len; ++i) {
        var child = list[i];
        if (child.key === k) {
            target = child;
            break;
        }
    }

    var v = target ? f(target.value) : f();
    return isNothing(v) ? arraySpliceOut(i, list) : arrayUpdate(i, new Leaf(h, k, v), list);
};

/* Lookups
 ******************************************************************************/
/**
 * Leaf::get
 */
Leaf.prototype.lookup = function (_, h, k) {
    return k === this.key ? this.value : nothing;
};

/**
 * Collision::get
 */
Collision.prototype.lookup = function (_, h, k) {
    if (h === this.hash) {
        var children = this.children;
        for (var i = 0, len = children.length; i < len; ++i) {
            var child = children[i];
            if (k === child.key) return child.value;
        }
    }
    return nothing;
};

/**
 * IndexedNode::get
 */
IndexedNode.prototype.lookup = function (shift, h, k) {
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    return this.mask & bit ? this.children[fromBitmap(this.mask, bit)].lookup(shift + SIZE, h, k) : nothing;
};

/**
 * ArrayNode::get
 */
ArrayNode.prototype.lookup = function (shift, h, k) {
    var frag = hashFragment(shift, h);
    var child = this.children[frag];
    return child.lookup(shift + SIZE, h, k);
};

empty.lookup = function () {
    return nothing;
};

/* Editing
 ******************************************************************************/
/**
 * Leaf::modify
 */
Leaf.prototype.modify = function (shift, f, h, k) {
    if (k === this.key) {
        var v = f(this.value);
        return isNothing(v) ? empty : new Leaf(h, k, v);
    }
    var v = f();
    return isNothing(v) ? this : mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

/**
 * Collision::modify
 */
Collision.prototype.modify = function (shift, f, h, k) {
    if (h === this.hash) {
        var list = updateCollisionList(this.hash, this.children, f, k);
        return list.length > 1 ? new Collision(this.hash, list) : list[0]; // collapse single element collision list
    }
    var v = f();
    return isNothing(v) ? this : mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

/**
 * IndexedNode::modify
 */
IndexedNode.prototype.modify = function (shift, f, h, k) {
    var mask = this.mask;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    var indx = fromBitmap(mask, bit);
    var exists = mask & bit;

    var child = (exists ? children[indx] : empty).modify(shift + SIZE, f, h, k);

    var removed = exists && isEmpty(child);
    var added = !exists && !isEmpty(child);

    var bitmap = removed ? mask & ~bit : added ? mask | bit : mask;

    return !bitmap ? empty : removed ? children.length <= 2 && isLeaf(children[indx ^ 1]) ? children[indx ^ 1] // collapse
    : new IndexedNode(bitmap, arraySpliceOut(indx, children)) : added ? children.length >= MAX_INDEX_NODE ? expand(frag, child, mask, children) : new IndexedNode(bitmap, arraySpliceIn(indx, child, children))

    // Modify
    : new IndexedNode(bitmap, arrayUpdate(indx, child, children));
};

/**
 * ArrayNode::modify
 */
ArrayNode.prototype.modify = function (shift, f, h, k) {
    var count = this.count;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var child = children[frag];
    var newChild = (child || empty).modify(shift + SIZE, f, h, k);

    return isEmpty(child) && !isEmpty(newChild)
    // add
    ? new ArrayNode(count + 1, arrayUpdate(frag, newChild, children)) : !isEmpty(child) && isEmpty(newChild)
    // remove
    ? count - 1 <= MIN_ARRAY_NODE ? pack(frag, children) : new ArrayNode(count - 1, arrayUpdate(frag, empty, children))

    // Modify
    : new ArrayNode(count, arrayUpdate(frag, newChild, children));
};

empty.modify = function (_, f, h, k) {
    var v = f();
    return isNothing(v) ? empty : new Leaf(h, k, v);
};

/* Queries
 ******************************************************************************/
/**
 * Lookup a value.
 * 
 * Returns the value stored for the given hash and key, or alt if none.
 * 
 * @param alt Fallback value.
 * @param h 32 bit hash.
 * @param k Key.
 * @param m HAMT
 */
var tryGetHash = hamt.tryGetHash = function (alt, h, k, m) {
    return maybe(m.lookup(0, h, k), alt);
};

/**
 * Lookup a value using the internal `hash`.
 * 
 * @see getHash
 */
var tryGet = hamt.tryGet = function (alt, k, m) {
    return tryGetHash(alt, hash(k), k, m);
};

/**
 * Lookup a value.
 * 
 * Returns the value stored for the given hash an key or null if none.
 * 
 * @param h 32 bit hash.
 * @param k Key.
 * @param m HAMT
 */
var getHash = hamt.getHash = function (h, k, m) {
    return tryGetHash(null, h, k, m);
};

/**
 * Lookup a value using the internal `hash`.
 * 
 * @see getHash
 */
var get = hamt.get = function (k, m) {
    return tryGet(null, k, m);
};

/**
 * Does an entry exist?
 * 
 * @param h 32 bit hash.
 * @param k Key.
 * @param m HAMT
 */
var hasHash = hamt.hasHash = function (h, k, m) {
    return !isNothing(tryGetHash(nothing, h, k, m));
};

/**
 * Check if a an entry exists using internal `hash`
 * 
 * @see hasHash
 */
var has = hamt.has = function (k, m) {
    return hasHash(hash(k), k, m);
};

/* Updates
 ******************************************************************************/
/**
 * Modify the value stored for a hash.
 * 
 * Returns the modified data structure. The input `m` is not modified.
 * 
 * @param h 32 bit hash.
 * @param k Key.
 * @param f Function mapping current value to new value.
 * @param m HAMT
 */
var modifyHash = hamt.modifyHash = function (h, k, f, m) {
    return m.modify(0, f, h, k);
};

/**
 * Store a value using the internal `hash` function to calculate the hash from `key`
 * 
 * @see modifyHash
 */
var modify = hamt.modify = function (k, f, m) {
    return modifyHash(hash(k), k, f, m);
};

/**
 * Store a value with an explicit hash.
 * 
 * @param h 32 bit hash.
 * @param k Key.
 * @param v Value to store.
 * @param m HAMT
 */
var setHash = hamt.setHash = function (h, k, v, m) {
    return modifyHash(h, k, constant(v), m);
};

/**
 * Store a value using the internal `hash` function to calculate the hash from `key`
 * 
 * @see setHash
 */
var set = hamt.set = function (k, v, m) {
    return setHash(hash(k), k, v, m);
};

/**
 * Delete a value with an explicit hash.
 * 
 * @param m HAMT
 * @param h 32 bit hash.
 * @param k Key.
 */
var del = constant(nothing);
var removeHash = hamt.removeHash = function (h, k, m) {
    return modifyHash(h, k, del, m);
};

/**
 * Delete a value using the internal `hash` function to calculate the hash from `key`
 * 
 * @see removeHash
 */
var remove = hamt.remove = function (k, m) {
    return removeHash(hash(k), k, m);
};

/* Fold
 ******************************************************************************/
/**
 * Leaf::fold
 */
Leaf.prototype.fold = function (f, z) {
    return f(z, this);
};

/**
 * Collision::fold
 */
Collision.prototype.fold = function (f, z) {
    return this.children.reduce(f, z);
};

/**
 * IndexedNode::fold
 * 
 * `this.children.reduce(fold@f, z)`
 */
IndexedNode.prototype.fold = function (f, z) {
    var children = this.children;
    for (var i = 0, len = children.length; i < len; ++i) {
        var c = children[i];
        z = c instanceof Leaf ? f(z, c) : c.fold(f, z);
    }
    return z;
};

/**
 * ArrayNode::fold
 * 
 * `this.children.reduce(fold@f, z)`
 */
ArrayNode.prototype.fold = function (f, z) {
    var children = this.children;
    for (var i = 0, len = children.length; i < len; ++i) {
        var c = children[i];
        if (!isEmpty(c)) z = c instanceof Leaf ? f(z, c) : c.fold(f, z);
    }
    return z;
};

/**
 * Visit every entry in the map, aggregating data.
 * 
 * Order of nodes is not guaranteed.
 * 
 * @param f Function mapping previous value and key value object to new value.
 * @param z Starting value.
 * @param m HAMT
 */
var fold = hamt.fold = function (f, z, m) {
    return isEmpty(m) ? z : m.fold(f, z);
};

/* Aggregate
 ******************************************************************************/
/**
 * Get the number of entries.
 * 
 * @param m HAMT.
 */
var inc = function inc(x) {
    return x + 1;
};
var count = hamt.count = function (m) {
    return fold(inc, 0, m);
};

/**
 * Get array of all key value pairs as arrays of [key, value].
 * 
 * Order is not guaranteed.
 *
 * @param m HAMT.
 */
var buildPairs = function buildPairs(p, x) {
    p.push(x);return p;
};
var pairs = hamt.pairs = function (m) {
    return fold(buildPairs, [], m);
};

/**
 * Get array of all keys.
 * 
 * Order is not guaranteed.
 * 
 * @param m HAMT.
 */
var buildKeys = function buildKeys(p, x) {
    p.push(x.key);return p;
};
var keys = hamt.keys = function (m) {
    return fold(buildKeys, [], m);
};

/**
 * Get array of all values.
 * 
 * Order is not guaranteed, duplicates will be preserved.
 * 
 * @param m HAMT.
 */
var buildValues = function buildValues(p, x) {
    p.push(x.value);return p;
};
var values = hamt.values = function (m) {
    return fold(buildValues, [], m);
};

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

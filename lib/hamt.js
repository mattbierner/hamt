/**
	@fileOverview Hash Array Mapped Trie.

	Code based on: https://github.com/exclipy/pdata
*/
const hamt = {}; // export

/* Configuration
 ******************************************************************************/
const SIZE = 5;

const BUCKET_SIZE = Math.pow(2, SIZE);

const MASK = BUCKET_SIZE - 1;

const MAX_INDEX_NODE = BUCKET_SIZE / 2;

const MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
const nothing = ({});

const constant = x => () => x;

const defaultValBind = (f, defaultValue) =>
    function(x) {
        return f(arguments.length === 0 ? defaultValue : x);
    };

/**
	Get 32 bit hash of string.

	Based on:
	http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
const hash = hamt.hash = str => {
    const type = typeof str;
    if (type === 'number')
        return str;
    if (type !== 'string')
        str += '';

    let hash = 0;
    for (let i = 0, len = str.length; i < len; ++i) {
        const c = str.charCodeAt(i);
        hash = (((hash << 5) - hash) + c) | 0;
    }
    return hash;
};

/* Bit Ops
 ******************************************************************************/
/**
	Hamming weight.

	Taken from: http://jsperf.com/hamming-weight
*/
const popcount = (x) => {
    x -= ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    x += (x >> 8);
    x += (x >> 16);
    return (x & 0x7f);
};

const hashFragment = (shift, h) =>
    (h >>> shift) & MASK;

const toBitmap = x =>
    1 << x;

const fromBitmap = (bitmap, bit) =>
    popcount(bitmap & (bit - 1));

/* Array Ops
 ******************************************************************************/
/**
	Set a value in an array.

	@param at Index to change.
	@param v New value
	@param arr Array.
*/
const arrayUpdate = (at, v, arr) => {
    const len = arr.length;
    const out = new Array(len);
    for (let i = 0; i < len; ++i)
        out[i] = arr[i];
    out[at] = v;
    return out;
};

/**
	Remove a value from an array.

	@param at Index to remove.
	@param arr Array.
*/
const arraySpliceOut = (at, arr) => {
    const len = arr.length;
    const out = new Array(len - 1);
    let i = 0, g = 0;
    while (i < at)
        out[g++] = arr[i++];
    ++i;
    while (i < len)
        out[g++] = arr[i++];
    return out;
};

/**
	Insert a value into an array.

	@param at Index to insert at.
	@param v Value to insert,
	@param arr Array.
*/
const arraySpliceIn = (at, v, arr) => {
    const len = arr.length;
    const out = new Array(len + 1);
    let i = 0, g = 0;
    while (i < at)
        out[g++] = arr[i++];
    out[g++] = v;
    while (i < len)
        out[g++] = arr[i++];
    return out;
};

/* Node Structures
 ******************************************************************************/
const LEAF = 1;
const COLLISION = 2;
const INDEX = 3;
const ARRAY = 4;

/**
	Empty node.
*/
const empty = ({ __hamt_isEmpty: true });

const isEmptyNode = x =>
    x === empty || (x && x.__hamt_isEmpty);

/**
	Leaf holding a value.

	@member hash Hash of key.
	@member key Key.
	@member value Value stored.
*/
const Leaf = (hash, key, value) => ({
    type: LEAF,
    hash: hash,
    key: key,
    value: value,
    _modify: Leaf__modify
});

/**
	Leaf holding multiple values with the same hash but different keys.

	@member hash Hash of key.
	@member children Array of collision children node.
*/
const Collision = (hash, children) => ({
    type: COLLISION,
    hash: hash,
    children: children,
    _modify: Collision__modify
});

/**
	Internal node with a sparse set of children.

	Uses a bitmap and array to pack children.

	@member mask Bitmap that encode the positions of children in the array.
	@member children Array of child nodes.
*/
const IndexedNode = (mask, children) => ({
    type: INDEX,
    mask: mask,
    children: children,
    _modify: IndexedNode__modify
});

/**
	Internal node with many children.

	@member size Number of children.
	@member children Array of child nodes.
*/
const ArrayNode = (size, children) => ({
    type: ARRAY,
    size: size,
    children: children,
    _modify: ArrayNode__modify
});

/**
	Is `node` a leaf node?
*/
const isLeaf = node =>
    (  node === empty
    || node.type ===  LEAF
    || node.type === COLLISION);

/* Internal node operations.
 ******************************************************************************/
/**
	Expand an indexed node into an array node.

	@param frag Index of added child.
	@param child Added child.
	@param mask Index node mask before child added.
	@param subNodes Index node children before child added.
*/
const expand = (frag, child, bitmap, subNodes) => {
    const arr = [];
    let bit = bitmap;
    let count = 0;
    for (let i = 0; bit; ++i) {
        if (bit & 1)
            arr[i] = subNodes[count++];
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
const pack = (count, removed, elements) => {
    const children = new Array(count - 1);
    let g = 0;
    let bitmap = 0;
    for (let i = 0, len = elements.length; i < len; ++i) {
        if (i !== removed) {
            const elem = elements[i];
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

	@param shift Current shift.
	@param h1 Node 1 hash.
	@param n1 Node 1.
	@param h2 Node 2 hash.
	@param n2 Node 2.
*/
const mergeLeaves = (shift, h1, n1, h2, n2) => {
    if (h1 === h2)
        return Collision(h1, [n2, n1]);

    const subH1 = hashFragment(shift, h1);
    const subH2 = hashFragment(shift, h2);
    return IndexedNode(toBitmap(subH1) | toBitmap(subH2),
        subH1 === subH2
            ?[mergeLeaves(shift + SIZE, h1, n1, h2, n2)]
            :subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
    Update an entry in a collision list.

    @param hash Hash of collision.
    @param list Collision list.
    @param f Update function.
    @param k Key to update.
    @param size Size reference
*/
const updateCollisionList = (h, list, f, k, size) => {
    const len = list.length;
    for (let i = 0; i < len; ++i) {
        const child = list[i];
        if (child.key === k) {
            const value = child.value;
            const newValue = f(value);
            if (newValue === value)
                return list;

            if (newValue === nothing) {
                --size.value
                return arraySpliceOut(i, list);
            }
            return arrayUpdate(i, Leaf(h, k, newValue), list);
        }
    }

    const newValue = f();
    if (newValue === nothing)
        return list;
    ++size.value;
    return arrayUpdate(len, Leaf(h, k, newValue), list);
};

/* Editing
 ******************************************************************************/
const Leaf__modify = function(shift, f, h, k, size) {
   if (k === this.key) {
        const v = f(this.value);
        if (v === this.value)
            return this;
        if (v === nothing) {
            --size.value;
            return empty;
        }
        return Leaf(h, k, v);
    }
    const v = f();
    if (v === nothing)
        return this;
    ++size.value;
    return mergeLeaves(shift, this.hash, this, h, Leaf(h, k, v));
};

const Collision__modify = function(shift, f, h, k, size) {
    if (h === this.hash) {
        const list = updateCollisionList(this.hash, this.children, f, k, size);
        if (list === this.children)
            return this;

        return list.length > 1
            ?Collision(this.hash, list)
            :list[0]; // collapse single element collision list
    }
    const v = f();
    if (v === nothing)
        return this;
    ++size.value;
    return mergeLeaves(shift, this.hash, this, h, Leaf(h, k, v));
};

const IndexedNode__modify = function(shift, f, h, k, size) {
    const mask = this.mask;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const bit = toBitmap(frag);
    const indx = fromBitmap(mask, bit);
    const exists = mask & bit;
    const current = exists ? children[indx] : empty;
    const child = current._modify(shift + SIZE, f, h, k, size);

    if (current === child)
        return this;

    if (exists && isEmptyNode(child)) { // remove
        const bitmap = mask & ~bit;
        if (!bitmap)
            return empty;
        return children.length <= 2 && isLeaf(children[indx ^ 1])
            ?children[indx ^ 1] // collapse
            :IndexedNode(
                bitmap,
                arraySpliceOut(indx, children))
    }
    if (!exists && !isEmptyNode(child)) { // add
        return children.length >= MAX_INDEX_NODE
            ?expand(frag, child, mask, children)
            :IndexedNode(
                mask | bit,
                arraySpliceIn(indx, child, children))
    }

    // modify
    return IndexedNode(
        mask,
        arrayUpdate(indx, child, children));
};

const ArrayNode__modify = function(shift, f, h, k, size) {
    const count = this.size;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const child = children[frag];
    const newChild = (child || empty)._modify(shift + SIZE, f, h, k, size);

    if (child === newChild)
        return this;

    if (isEmptyNode(child) && !isEmptyNode(newChild)) { // add
        return ArrayNode(
            count + 1,
            arrayUpdate(frag, newChild, children))
    }
    if (!isEmptyNode(child) && isEmptyNode(newChild)) { // remove
        return count - 1 <= MIN_ARRAY_NODE
            ?pack(count, frag, children)
            :ArrayNode(
                count - 1,
                arrayUpdate(frag, empty, children))
    }

    // modify
    return ArrayNode(
        count,
        arrayUpdate(frag, newChild, children));
};

empty._modify = (_, f, h, k, size) => {
    const v = f();
    if (v === nothing)
        return empty;
    ++size.value;
    return Leaf(h, k, v);
};

/*
 ******************************************************************************/
function Map(root, size) {
    this._root = root;
    this._size = size;
};

Map.prototype.setTree = function(root, size) {
    return root === this._root ? this : new Map(root, size);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
const tryGetHash = hamt.tryGetHash = (alt, hash, key, map) => {
    let node = map._root;
    let shift = 0;
    while (true) switch (node.type) {
    case LEAF:
    {
        return key === node.key ? node.value : alt;
    }
    case COLLISION:
    {
        if (hash === node.hash) {
            const children = node.children;
            for (let i = 0, len = children.length; i < len; ++i) {
                const child = children[i];
                if (key === child.key)
                    return child.value;
            }
        }
        return alt;
    }
    case INDEX:
    {
        const frag = hashFragment(shift, hash);
        const bit = toBitmap(frag);
        if (node.mask & bit) {
            node = node.children[fromBitmap(node.mask, bit)]
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
};

Map.prototype.tryGetHash = function(alt, hash, key) {
    return tryGetHash(alt, hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `tryGetHash`
*/
const tryGet = hamt.tryGet = (alt, key, map) =>
    tryGetHash(alt, hash(key), key, map);

Map.prototype.tryGet = function(alt, key) {
    return tryGet(alt, key, this);
};

/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `undefined` if none.
*/
const getHash = hamt.getHash = (hash, key, map) =>
    tryGetHash(undefined, hash, key, map);

Map.prototype.getHash = function(hash, key) {
    return getHash(hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `get`
*/
const get = hamt.get = (key, map) =>
    tryGetHash(undefined, hash(key), key, map);

Map.prototype.get = function(key, alt) {
    return tryGet(alt, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
const hasHash = hamt.has = (hash, key, map) =>
    tryGetHash(nothing, hash, key, map) !== nothing;

Map.prototype.hasHash = function(hash, key) {
    return hasHash(hash, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses internal hash function.
*/
const has = hamt.has = (key, map) =>
    hasHash(hash(key), key, map);

Map.prototype.has = function(key) {
    return has(key, this);
};

/**
    Empty node.
*/
hamt.empty = new Map(empty, 0);

/**
    Does `map` contain any elements?
*/
const isEmpty = hamt.isEmpty = (map) =>
    !!isEmptyNode(map._root);

Map.prototype.isEmpty = function() {
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
const modifyHash = hamt.modifyHash = (f, hash, key, map) => {
    const size = { value: map._size };
    const newRoot = map._root._modify(0, f, hash, key, size);
    return map.setTree(newRoot, size.value);
};

Map.prototype.modifyHash = function(hash, key, f) {
    return modifyHash(f, hash, key, this);
};

/**
    Alter the value stored for `key` in `map` using function `f` using
    internal hash function.

    @see `modifyHash`
*/
const modify = hamt.modify = (f, key, map) =>
    modifyHash(f, hash(key), key, map);

Map.prototype.modify = function(key, f) {
    return modify(f, key, this);
};

/**
    Same as `modifyHash`, but invokes `f` with `defaultValue` if no entry exists.

    @see `modifyHash`
*/
const modifyValueHash = hamt.modifyValueHash = (f, defaultValue, hash, key, map) =>
    modifyHash(defaultValBind(f, defaultValue), hash, key, map);

Map.prototype.modifyValueHash = function(hash, key, f, defaultValue) {
    return modifyValueHash(f, defaultValue, hash, key, this);
};

/**
    @see `modifyValueHash`
*/
const modifyValue = hamt.modifyValue = (f, defaultValue, key, map) =>
    modifyValueHash(f, defaultValue, hash(key), key,  map);

Map.prototype.modifyValue = function(key, f, defaultValue) {
    return modifyValue(f, defaultValue, key, this);
};

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
const setHash = hamt.setHash = function(hash, key, value, map) {
    return modifyHash(constant(value), hash, key, map);
}

Map.prototype.setHash = function(hash, key, value) {
    return setHash(hash, key, value, this);
};

/**
    Store `value` for `key` in `map` using internal hash function.

    @see `setHash`
*/
const set = hamt.set = (key, value, map) =>
    setHash(hash(key), key, value, map);

Map.prototype.set = function(key, value) {
    return set(key, value, this);
};

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
const del = constant(nothing);
const removeHash = hamt.removeHash = (hash, key, map) =>
    modifyHash(del, hash, key, map);

Map.prototype.removeHash = Map.prototype.deleteHash = function(hash, key) {
    return removeHash(hash, key, this);
};

/**
    Remove the entry for `key` in `map` using internal hash function.

    @see `removeHash`
*/
const remove = hamt.remove = (key, map) =>
    removeHash(hash(key), key, map);

Map.prototype.remove = Map.prototype.delete = function(key) {
    return remove(key, this);
};

/* Traversal
 ******************************************************************************/
/**
    Apply a continuation.
*/
const appk = k =>
    k && lazyVisitChildren(k[0], k[1], k[2], k[3], k[4]);

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
var lazyVisitChildren = (len, children, i, f, k) => {
    while (i < len) {
        var child = children[i++];
        if (child && !isEmptyNode(child))
            return lazyVisit(child, f, [len, children, i, f, k]);
    }
    return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
const lazyVisit = (node, f, k) => {
    switch (node.type) {
    case LEAF:
        return { value: f(node), rest: k };

    case COLLISION:
    case ARRAY:
    case INDEX:
        const children = node.children;
        return lazyVisitChildren(children.length, children, 0, f, k);

    default:
        return appk(k);
    }
};

const DONE = { done: true };

/**
    Javascript iterator over a map.
*/
function MapIterator(v) {
    this.v = v;
};

MapIterator.prototype.next = function() {
    if (!this.v)
        return DONE;
    const v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
};

MapIterator.prototype[Symbol.iterator] = function() {
    return this;
};

/**
    Lazily visit each value in map with function `f`.
*/
const visit = (map, f) =>
    new MapIterator(lazyVisit(map._root, f));

/**
    Get a Javascsript iterator of `map`.

    Iterates over `[key, value]` arrays.
*/
const buildPairs = (x) => [x.key, x.value];
const entries = hamt.entries = (map) =>
    visit(map, buildPairs);

Map.prototype.entries = Map.prototype[Symbol.iterator] = function() {
    return entries(this);
};

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
const buildKeys = (x) => x.key;
const keys = hamt.keys = (map) =>
    visit(map, buildKeys);

Map.prototype.keys = function() { return keys(this); }

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
const buildValues = x => x.value;
const values = hamt.values = Map.prototype.values = map =>
    visit(map, buildValues);

Map.prototype.values = function() {
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
const fold = hamt.fold = (f, z, m) => {
    const root = m._root;
    if (root.type === LEAF)
        return f(z, root.value, root.key);

    const toVisit = [root.children];
    let children;
    while (children = toVisit.pop()) {
        for (let i = 0, len = children.length; i < len; ) {
            const child = children[i++];
            if (child && child.type) {
                if (child.type === LEAF)
                    z = f(z, child.value, child.key);
                else
                    toVisit.push(child.children);
            }
        }
    }
    return z;
};

Map.prototype.fold = function(f, z) {
    return fold(f, z, this);
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function invoked with value and key
    @param map HAMT
*/
const forEach = hamt.forEach = (f, map) =>
    fold((_, value, key) => f(value, key, map), null, map);

Map.prototype.forEach = function(f) {
    return forEach(f, this);
};

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
const count = hamt.count = map =>
    map._size;

Map.prototype.count = function() {
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
    define('hamt', [], () => hamt);
} else {
    this.hamt = hamt;
}

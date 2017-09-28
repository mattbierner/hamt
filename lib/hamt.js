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
    Leaf holding a value.

    @member hash Hash of key.
    @member key Key.
    @member value Value stored.
*/
const Leaf = (hash, key, value) => ({
    type: LEAF,
    hash,
    key,
    value,
    _modify: Leaf__modify
});

/**
    Leaf holding multiple values with the same hash but different keys.

    @member hash Hash of key.
    @member children Array of collision children node.
*/
const Collision = (hash, children) => ({
    type: COLLISION,
    hash,
    children,
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
    mask,
    children,
    _modify: IndexedNode__modify
});

/**
    Internal node with many children.

    @member size Number of children.
    @member children Array of child nodes.
*/
const ArrayNode = (size, children) => ({
    type: ARRAY,
    size,
    children,
    _modify: ArrayNode__modify
});

/**
    Is `node` a leaf node?
*/
const isLeaf = node =>
    (node.type === LEAF || node.type === COLLISION);

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
            if (elem) {
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
            ? [mergeLeaves(shift + SIZE, h1, n1, h2, n2)]
            : subH1 < subH2 ? [n1, n2] : [n2, n1]);
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
            if (f.__hamt_delete_op) {
                --size.value
                return arraySpliceOut(i, list);
            }
            const newValue = f.__hamt_set_op ? f.value : f(value);
            if (newValue === value)
                return list;
            return arrayUpdate(i, Leaf(h, k, newValue), list);
        }
    }

    if (f.__hamt_delete_op)
        return list;
    const newValue = f.__hamt_set_op ? f.value : f();
    ++size.value;
    return arrayUpdate(len, Leaf(h, k, newValue), list);
};

/* Editing
 ******************************************************************************/
const Leaf__modify = function(shift, op, h, k, size) {
    if (k === this.key) {
        if (op.__hamt_delete_op) {
            --size.value;
            return undefined;
        }
        const currentValue = this.value;
        const newValue = op.__hamt_set_op ? op.value : op(currentValue);
        return newValue === currentValue ? this : Leaf(h, k, newValue);
    }
    if (op.__hamt_delete_op)
        return this;
    const newValue = op.__hamt_set_op ? op.value : op();
    ++size.value;
    return mergeLeaves(shift, this.hash, this, h, Leaf(h, k, newValue));
};

const Collision__modify = function(shift, op, h, k, size) {
    if (h === this.hash) {
        const list = updateCollisionList(this.hash, this.children, op, k, size);
        if (list === this.children)
            return this;

        return list.length > 1
            ? Collision(this.hash, list)
            : list[0]; // collapse single element collision list
    }
    if (op.__hamt_delete_op)
        return this;
    const newValue = op.__hamt_set_op ? op.value : op();
    ++size.value;
    return mergeLeaves(shift, this.hash, this, h, Leaf(h, k, newValue));
};

const IndexedNode__modify = function(shift, op, h, k, size) {
    const mask = this.mask;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const bit = toBitmap(frag);
    const indx = fromBitmap(mask, bit);
    const exists = mask & bit;
    if (!exists) { // add
        const newChild = empty__modify(shift + SIZE, op, h, k, size);
        if (!newChild)
            return this;
        
        return children.length >= MAX_INDEX_NODE
            ? expand(frag, newChild, mask, children)
            : IndexedNode(
                mask | bit,
                arraySpliceIn(indx, newChild, children));
    }

    const current = children[indx];
    const newChild = current._modify(shift + SIZE, op, h, k, size);
    if (current === newChild)
        return this;

    if (!newChild) { // remove
        const bitmap = mask & ~bit;
        if (!bitmap) 
            return undefined;
        
        return children.length === 2 && isLeaf(children[indx ^ 1])
            ? children[indx ^ 1] // collapse
            : IndexedNode(
                bitmap,
                arraySpliceOut(indx, children));
    }

    // modify
    return children.length === 1 && isLeaf(newChild)
        ? newChild // propagate collapse
        : IndexedNode(
            mask,
            arrayUpdate(indx, newChild, children));
};

const ArrayNode__modify = function(shift, op, h, k, size) {
    const count = this.size;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const child = children[frag];
    const newChild = child ? child._modify(shift + SIZE, op, h, k, size) : empty__modify(shift + SIZE, op, h, k, size);

    if (child === newChild)
        return this;

    if (!child && newChild) { // add
        return ArrayNode(
            count + 1,
            arrayUpdate(frag, newChild, children))
    }
    if (child && !newChild) { // remove
        return count - 1 <= MIN_ARRAY_NODE
            ? pack(count, frag, children)
            : ArrayNode(
                count - 1,
                arrayUpdate(frag, undefined, children))
    }

    // modify
    return ArrayNode(
        count,
        arrayUpdate(frag, newChild, children));
};

const empty__modify = (_, op, h, k, size) => {
    if (op.__hamt_delete_op)
        return undefined;
    const newValue = op.__hamt_set_op ? op.value : op();
    ++size.value;
    return Leaf(h, k, newValue);
};

/*
 ******************************************************************************/
function Map(root, size) {
    this.root = root;
    this.size = size;
};

Map.prototype.__hamt_isMap = true;

Map.prototype.setTree = function(root, size) {
    return root === this.root ? this : new Map(root, size);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
const tryGetHash = hamt.tryGetHash = (alt, hash, key, map) => {
    if (!map.root)
        return alt;

    let node = map.root;
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

const nothing = ({});
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
hamt.empty = new Map(undefined, 0);

/**
    Is `value` a map?
*/
hamt.isMap = (value) =>
    !!(value && value.__hamt_isMap);

/**
    Does `map` contain any elements?
*/
hamt.isEmpty = (map) =>
    hamt.isMap(map) && !map.root;

Map.prototype.isEmpty = function() {
    return hamt.isEmpty(this);
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
    const size = { value: map.size };
    const newRoot = map.root ? map.root._modify(0, f, hash, key, size) : empty__modify(0, f, hash, key, size);
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
    modifyValueHash(f, defaultValue, hash(key), key, map);

Map.prototype.modifyValue = function(key, f, defaultValue) {
    return modifyValue(f, defaultValue, key, this);
};

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
const setHash = hamt.setHash = function(hash, key, value, map) {
    return modifyHash({ __hamt_set_op: true, value: value }, hash, key, map);
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
const del = { __hamt_delete_op: true };
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
    k && lazyVisitChildren(k.len, k.children, k.i, k.f, k.k);

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
const lazyVisitChildren = (len, children, i, f, k) => {
    while (i < len) {
        const child = children[i++];
        if (child)
            return lazyVisit(child, f, {len, children, i, f, k});
    }
    return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
const lazyVisit = (node, f, k) => {
    if (node.type === LEAF) 
        return { value: f(node), rest: k };

    const children = node.children;
    return lazyVisitChildren(children.length, children, 0, f, k);
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
    new MapIterator(map.root ? lazyVisit(map.root, f) : undefined);

/**
    Get a Javascript iterator of `map`.

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
    const root = m.root;
    if (!root)
        return z;

    if (root.type === LEAF)
        return f(z, root.value, root.key);

    for (let toVisit = root; toVisit; ) {
        const children = toVisit.children;
        toVisit = toVisit.next;
        for (let i = 0, len = children.length; i < len;) {
            const child = children[i++];
            if (child) {
                if (child.type === LEAF)
                    z = f(z, child.value, child.key);
                else
                    toVisit = { children: child.children, next: toVisit } 
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
const count = hamt.count = (map) => map.size;

Map.prototype.count = function() {
    return count(this);
};

/* Export
 ******************************************************************************/
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hamt;
} else if (typeof define === 'function' && define.amd) {
    define('hamt', [], () => hamt);
} else {
    this.hamt = hamt;
}

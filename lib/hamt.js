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

/**
	Get 32 bit hash of string.
	
	Based on:
	http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
const hash = hamt.hash = str => {
    if (typeof str === 'number')
        return str;
    
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
    return new ArrayNode(count + 1, arr);
};

/**
	Collapse an array node into a indexed node.
*/
const pack = (count, removed, elements) => {
    const children = new Array(count - 1);
    let g = 0;
    let bitmap = 0;
    for (let i = 0, len = elements.length; i < len; ++i) {
        const elem = elements[i];
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
const mergeLeaves = (shift, h1, n1, h2, n2) => {
    if (h1 === h2)
        return new Collision(h1, [n2, n1]);
    
    const subH1 = hashFragment(shift, h1);
    const subH2 = hashFragment(shift, h2);
    return new IndexedNode(toBitmap(subH1) | toBitmap(subH2),
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
*/
const updateCollisionList = (h, list, f, k) => {
    let target;
    let i = 0;
    for (const len = list.length; i < len; ++i) {
        const child = list[i];
        if (child.key === k) {
            target = child;
            break;
        }
    }
    
    const v = target ? f(target.value) : f();
    return v === nothing
        ?arraySpliceOut(i, list)
        :arrayUpdate(i, new Leaf(h, k, v), list);
};

/* Lookups
 ******************************************************************************/
var _lookup = (node, h, k) => {
    let shift = 0;
    while (true) switch (node.type) {
    case LEAF:
    {
        return k === node.key ? node.value : nothing;
    }   
    case COLLISION:
    {
        if (h === node.hash) {
            const children = node.children;
            for (let i = 0, len = children.length; i < len; ++i) {
                const child = children[i];
                if (k === child.key)
                    return child.value;
            }
        }
        return nothing;
    }
    case INDEX:
    {
        const frag = hashFragment(shift, h);
        const bit = toBitmap(frag);
        if (node.mask & bit) {
            node = node.children[fromBitmap(node.mask, bit)]
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
};

/* Editing
 ******************************************************************************/
Leaf.prototype._modify = function(shift, f, h, k) {
   if (k === this.key) {
        const v = f(this.value);
        if (v === this.value)
            return this;
        return v === nothing ? empty : new Leaf(h, k, v);
    }
    const v = f();
    return v === nothing
        ?this
        :mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

Collision.prototype._modify = function(shift, f, h, k) {
    if (h === this.hash) {
        const list = updateCollisionList(this.hash, this.children, f, k);
        return list.length > 1
            ?new Collision(this.hash, list)
            :list[0]; // collapse single element collision list
    }
    const v = f();
    return v === nothing
        ?this
        :mergeLeaves(shift, this.hash, this, h, new Leaf(h, k, v));
};

IndexedNode.prototype._modify = function(shift, f, h, k) {
    const mask = this.mask;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const bit = toBitmap(frag);
    const indx = fromBitmap(mask, bit);
    const exists = mask & bit;
    const current = exists ? children[indx] : empty;
    const child = current._modify(shift + SIZE, f, h, k);
    
    if (current === child)
        return this;
    
    if (exists && isEmptyNode(child)) { // remove
        const bitmap = mask & ~bit;
        if (!bitmap)
            return empty;
        return children.length <= 2 && isLeaf(children[indx ^ 1])
            ?children[indx ^ 1] // collapse
            :new IndexedNode(
                bitmap,
                arraySpliceOut(indx, children))
    }
    if (!exists && !isEmptyNode(child)) { // add
        return children.length >= MAX_INDEX_NODE
            ?expand(frag, child, mask, children)
            :new IndexedNode(
                mask | bit,
                arraySpliceIn(indx, child, children))
    }
    
    // modify
    return new IndexedNode(mask,
        arrayUpdate(indx, child, children));
};

ArrayNode.prototype._modify = function(shift, f, h, k) {
    const count = this.size;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const child = children[frag];
    const newChild = (child || empty)._modify(shift + SIZE, f, h, k);
    
    if (child === newChild)
        return this;
    
    if (isEmptyNode(child) && !isEmptyNode(newChild)) { // add
        return new ArrayNode(
            count + 1,
            arrayUpdate(frag, newChild, children))
    }
    if (!isEmptyNode(child) && isEmptyNode(newChild)) { // remove
        return count - 1 <= MIN_ARRAY_NODE
            ?pack(count, frag, children)
            :new ArrayNode(
                count - 1,
                arrayUpdate(frag, empty, children))
    }
    
    // modify
    return new ArrayNode(count,
        arrayUpdate(frag, newChild, children));
};

empty._modify = (_, f, h, k) => {
    const v = f();
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
const tryGetHash = hamt.tryGetHash = (alt, hash, key, map) => {
    const v = _lookup(map.root, hash, key);
    return v === nothing ? alt : v;
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
hamt.empty = new Map(empty);

/**
    Does `map` contain any elements?
*/
const isEmpty = hamt.isEmpty = (map) =>
    !!isEmptyNode(map.root);
    
Map.prototype.isEmpty = function() {
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
const modifyHash = hamt.modifyHash = (f, hash, key, map) => {
    var newRoot = map.root._modify(0, f, hash, key);
    return newRoot === map.root ?
        map : new Map(newRoot);
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
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
const setHash = hamt.setHash = (hash, key, value, map) =>
    modifyHash(constant(value), hash, key, map);

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
    new MapIterator(lazyVisit(map.root, f));

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
Leaf.prototype._fold = function(f, z) {
    return f(z, this.value, this.key);
};

empty._fold = (f, z) => z;

Collision.prototype._fold = IndexedNode.prototype._fold = function(f, z) {
    const children = this.children;
    for (let i = 0, len = children.length; i < len; ++i) {
        const c = children[i];
        z = c.type === LEAF
            ?f(z, c.value, c.key)
            :c._fold(f, z);
    } 
    return z;
}; 

ArrayNode.prototype._fold = function(f, z) {
    const children = this.children;
    for (let i = 0, len = children.length; i < len; ++i) {
        const c = children[i];
        if (c && !isEmptyNode(c))
            z = c.type === LEAF
                ?f(z, c.value, c.key)
                :c._fold(f, z);
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
const fold = hamt.fold = (f, z, m) =>
    m.root._fold(f, z);

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
const inc = x => x + 1;
const count = hamt.count = map =>
    fold(inc, 0, map);

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

/**
 * @fileOverview Hash Array Mapped Trie.
 * 
 * Code based on: https://github.com/exclipy/pdata
*/
const hamt = {};

const constant = x => () => x;

/* Configuration
 ******************************************************************************/
const SIZE = 5;

const BUCKET_SIZE = Math.pow(2, SIZE);

const MASK = BUCKET_SIZE - 1;

const MAX_INDEX_NODE = BUCKET_SIZE / 2;

const MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/* Nothing
 ******************************************************************************/
const nothing = ({ __hamt_nothing: true });

const isNothing = x =>
    x === nothing || (x && x.__hamt_nothing);

const maybe = (val, def) =>
    isNothing(val) ? def : val;

/* Bit Ops
 ******************************************************************************/
/**
 * Hamming weight.
 * 
 * Taken from: http://jsperf.com/hamming-weight
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
 * Set a value in an array.
 * 
 * @param at Index to change.
 * @param v New value
 * @param arr Array.
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
 * Remove a value from an array.
 * 
 * @param at Index to remove.
 * @param arr Array.
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
 * Insert a value into an array.
 * 
 * @param at Index to insert at.
 * @param v Value to insert,
 * @param arr Array.
*/
const arraySpliceIn = (at, v, arr) => {
    const len = arr.length;
    const out = new Array(len + 1);
    let i = 0;
    let g = 0;
    while (i < at)
        out[g++] = arr[i++];
    out[g++] = v;
    while (i < len)
        out[g++] = arr[i++];
    return out;
};

/* 
 ******************************************************************************/
/**
 * Get 32 bit hash of string.
 * 
 * Based on:
 * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
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

/* Node Structures
 ******************************************************************************/
const Node = function() { };
 
/**
 * Empty node.
*/
const empty = hamt.empty = new Node();
empty.__hamt_isEmpty = true;

/**
 * Leaf holding a value.
 * 
 * @member hash Hash of key.
 * @member key Key.
 * @member value Value stored.
*/
const Leaf = function(hash, key, value) {
    this.hash = hash;
    this.key = key;
    this.value = value;
};
Leaf.prototype = new Node;

/**
 * Leaf holding multiple values with the same hash but different keys.
 * 
 * @member hash Hash of key.
 * @member children Array of collision children node.
*/
const Collision = function(hash, children) {
    this.hash = hash;
    this.children = children;
};
Collision.prototype = new Node;

/**
 * Internal node with a sparse set of children.
 * 
 * Uses a bitmap and array to pack children.
 * 
 * @member mask Bitmap that encode the positions of children in the array.
 * @member children Array of child nodes.
*/
const IndexedNode = function(mask, children) {
    this.mask = mask;
    this.children = children;
};
IndexedNode.prototype = new Node;

/**
 * Internal node with many children.
 * 
 * @member count Number of children.
 * @member children Array of child nodes.
*/
const ArrayNode = function(count, children) {
    this.count = count;
    this.children = children;
};
ArrayNode.prototype = new Node;

/* 
 ******************************************************************************/
const isEmpty = x =>
    !x || x === empty || (x && x.__hamt_isEmpty);

/**
 * Is `node` a leaf node?
*/
const isLeaf = node => 
    (  node === empty
    || node instanceof Leaf
    || node instanceof Collision);

/**
 * Expand an indexed node into an array node.
 * 
 * @param frag Index of added child.
 * @param child Added child.
 * @param mask Index node mask before child added.
 * @param subNodes Index node children before child added.
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
 * Collapse an array node into a indexed node.
*/
const pack = (count, removed, elements) => {
    const children = new Array(count - 1);
    let g = 0;
    let bitmap = 0;
    for (let i = 0, len = elements.length; i < len; ++i) {
        const elem = elements[i];
        if (i !== removed && !isEmpty(elem)) {
            children[g++] = elem;
            bitmap |= 1 << i;
        }
    }
    return new IndexedNode(bitmap, children);
};

/**
 * Merge two leaf nodes.
 * 
 * @param shift Current shift.
 * @param h1 Node 1 hash.
 * @param n1 Node 1.
 * @param h2 Node 2 hash.
 * @param n2 Node 2.
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
 * Update an entry in a collision list.
 * 
 * @param hash Hash of collision.
 * @param list Collision list.
 * @param f Update function.
 * @param k Key to update.
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
    return isNothing(v)
        ?arraySpliceOut(i, list)
        :arrayUpdate(i, new Leaf(h, k, v), list);
};

/* Lookups
 ******************************************************************************/
/**
 * Leaf::get
*/
Leaf.prototype._lookup = function(_, h, k) {
    return k === this.key ? this.value : nothing;
};

/**
 * Collision::get
*/
Collision.prototype._lookup = function(_, h, k) {
    if (h === this.hash) {
        const children = this.children;
        for (let i = 0, len = children.length; i < len; ++i) {
            const child = children[i];
            if (k === child.key)
                return child.value;
        }
    }
    return nothing;
};

/**
 * IndexedNode::get
*/
IndexedNode.prototype._lookup = function(shift, h, k) {
    const frag = hashFragment(shift, h);
    const bit = toBitmap(frag);
    return this.mask & bit
        ?this.children[fromBitmap(this.mask, bit)]._lookup(shift + SIZE, h, k)
        :nothing;
};

/**
 * ArrayNode::get
*/
ArrayNode.prototype._lookup = function(shift, h, k) {
    const frag = hashFragment(shift, h);
    const child = this.children[frag];
    return child._lookup(shift + SIZE, h, k);
};

empty._lookup = () => nothing;

/* Editing
 ******************************************************************************/
Leaf.prototype._modify = function(shift, f, h, k) {
   if (k === this.key) {
        const v = f(this.value);
        return isNothing(v) ? empty : new Leaf(h, k, v);
    }
    const v = f();
    return isNothing(v)
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
    return isNothing(v)
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
        
    if (exists && isEmpty(child)) { // remove
        const bitmap = mask & ~bit;
        if (!bitmap)
            return empty;
        return children.length <= 2 && isLeaf(children[indx ^ 1])
            ?children[indx ^ 1] // collapse
            :new IndexedNode(
                bitmap,
                arraySpliceOut(indx, children))
    }
    if (!exists && !isEmpty(child)) { // add
        return children.length >= MAX_INDEX_NODE
            ?expand(frag, child, mask, children)
            :new IndexedNode(
                mask | bit,
                arraySpliceIn(indx, child, children))
    }
    
    // modify
    return current === child
        ?this
        :new IndexedNode(
            mask,
            arrayUpdate(indx, child, children));
};

ArrayNode.prototype._modify = function(shift, f, h, k) {
    const count = this.count;
    const children = this.children;
    const frag = hashFragment(shift, h);
    const child = children[frag];
    const newChild = (child || empty)._modify(shift + SIZE, f, h, k);
    
    if (isEmpty(child) && !isEmpty(newChild)) { // add
        return new ArrayNode(
            count + 1,
            arrayUpdate(frag, newChild, children))
    }
    if (!isEmpty(child) && isEmpty(newChild)) { // remove
        return count - 1 <= MIN_ARRAY_NODE
            ?pack(count, frag, children)
            :new ArrayNode(
                count - 1,
                arrayUpdate(frag, empty, children))
    }
    
    // modify
    return child === newChild
        ?this
        :new ArrayNode(
            count,
            arrayUpdate(frag, newChild, children));
};

empty._modify = (_, f, h, k) => {
    const v = f();
    return isNothing(v) ? empty : new Leaf(h, k, v);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map`.
    
    Returns the value or `alt` if none.
*/
const tryGet = hamt.tryGet = (alt, key, map) =>
    maybe(map._lookup(0, hash(key), key), alt);

Node.prototype.tryGet = function(key, alt) {
    return tryGet(alt, key, this);
};

/**
    Lookup the value for `key` in `map`.
    
    Returns the value or `undefined` if none.
*/
const get = hamt.get = (key, map) =>
    tryGet(undefined, key, map);

Node.prototype.get = function(key, alt) {
    return tryGet(alt, key, this);
};

/**
    Does an entry exist for `key` in `map`?
*/
const has = hamt.has = (key, map) =>
    !isNothing(tryGet(nothing, key, map));

Node.prototype.has = function(key) {
    return has(key, this);
};

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f`.
    
    `f` is invoked with the current value for `k` if it exists,
    or no arguments if no such value exists. `modify` will always either
    update or insert a value into the map.
    
    Returns a map with the modified value. Does not alter `map`.
*/
const modify = hamt.modify = (f, key, map) =>
    map._modify(0, f, hash(key), key);

Node.prototype.modify = function(key, f) {
    return modify(f, key, this);
};

/**
    Store `value` for `key` in `map`.

    Returns a map with the modified value. Does not alter `map`.
*/
const set = hamt.set = (value, key, map) =>
    modify(constant(value), key, map);

Node.prototype.set = function(key, value) {
    return set(value, key, this);
};

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
const del = constant(nothing);
const remove = hamt.remove = (key, map) =>
    modify(del, key, map);

Node.prototype.remove = Node.prototype.delete = function(key) {
    return remove(key, this);
};

/* Fold
 ******************************************************************************/
Leaf.prototype.fold = function(f, z) {
    return f(z, this.value, this.key);
};

Collision.prototype.fold = function(f, z) {
    return this.children.reduce((p, c) => f(p, c.value, c.key), z);
};

IndexedNode.prototype.fold = function(f, z) {
    const children = this.children;
    for (let i = 0, len = children.length; i < len; ++i) {
        const c = children[i];
        z = c instanceof Leaf
            ?f(z, c.value, c.key)
            :c.fold(f, z);
    } 
    return z;
};

ArrayNode.prototype.fold = function(f, z) {
    const children = this.children;
    for (let i = 0, len = children.length; i < len; ++i) {
        const c = children[i];
        if (!isEmpty(c))
            z = c instanceof Leaf
                ?f(z, c.value, c.key)
                :c.fold(f, z);
    } 
    return z;
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.
    
    @param f Function mapping previous value and key value object to new value.
    @param z Starting value.
    @param m HAMT
*/
const fold = hamt.fold = (f, z, m) =>
    isEmpty(m) ? z : m.fold(f, z);

Node.prototype.fold = function(f, z) {
    return fold(f, z, this);
};

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
let inc = x => x + 1;
const count = hamt.count = map =>
    fold(inc, 0, map);

Node.prototype.count = function() {
    return count(this);
};

/**
    Get array of all key value pairs as arrays of [key, value] in `map`.
 
    Order is not guaranteed.
*/
const buildPairs = (p, value, key) => { p.push([key, value]); return p; };
const pairs = hamt.pairs = map =>
    fold(buildPairs, [], m);

Node.prototype.pairs = function() {
    return count(this);
};

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
const buildKeys = (p, _, key) => { p.push(key); return p; };
const keys = hamt.keys = m =>
    fold(buildKeys, [], m);

Node.prototype.keys = function() {
    return keys(this);
};

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
const buildValues = (p, value) => { p.push(value); return p; };
const values = hamt.values = m =>
    fold(buildValues, [], m);

Node.prototype.values = function() {
    return values(this);
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

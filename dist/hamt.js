/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/hamt.kep'
 * DO NOT EDIT
*/
define(["require", "exports"], (function(require, exports) {
    "use strict";
    var hash, empty, tryGetHash, tryGet, getHash, get, hasHash, has, setHash, set, modifyHash, modify,
            removeHash, remove, fold, count, pairs, keys, values, constant = (function(x) {
                return (function() {
                    return x;
                });
            }),
        BUCKET_SIZE = Math.pow(2, 5),
        mask = (BUCKET_SIZE - 1),
        MAX_INDEX_NODE = (BUCKET_SIZE / 2),
        MIN_ARRAY_NODE = (BUCKET_SIZE / 4),
        nothing = ({}),
        isNothing = (function(x) {
            return (x === nothing);
        }),
        maybe = (function(val, def) {
            return (isNothing(val) ? def : val);
        }),
        popcount = (function(x) {
            var x0 = (x - ((x >> 1) & 1431655765)),
                x1 = ((x0 & 858993459) + ((x0 >> 2) & 858993459)),
                x2 = ((x1 + (x1 >> 4)) & 252645135),
                x3 = (x2 + (x2 >> 8)),
                x4 = (x3 + (x3 >> 16));
            return (x4 & 127);
        }),
        hashFragment = (function(shift, h) {
            return ((h >>> shift) & mask);
        }),
        toBitmap = (function(x) {
            return (1 << x);
        }),
        fromBitmap = (function(bitmap, bit) {
            return popcount((bitmap & (bit - 1)));
        }),
        arrayUpdate = (function(at, v, arr) {
            var len = arr.length,
                out = new(Array)(len);
            for (var i = 0;
                (i < len);
                (i = (i + 1))) {
                (out[i] = arr[i]);
            }
            (out[at] = v);
            return out;
        }),
        arraySpliceOut = (function(at, arr) {
            var len = arr.length,
                out = new(Array)((len - 1)),
                i = 0;
            for (;
                (i < at);
                (i = (i + 1))) {
                (out[i] = arr[i]);
            }
            (i = (i + 1));
            for (;
                (i < len);
                (i = (i + 1))) {
                (out[(i - 1)] = arr[i]);
            }
            return out;
        }),
        arraySpliceIn = (function(at, v, arr) {
            var len = arr.length,
                out = new(Array)((len + 1)),
                i = 0;
            for (;
                (i < at);
                (i = (i + 1))) {
                (out[i] = arr[i]);
            }
            (out[i] = v);
            for (;
                (i < len);
                (i = (i + 1))) {
                (out[(i + 1)] = arr[i]);
            }
            return out;
        });
    (hash = (function(str) {
        if (((typeof str) === "number")) return str;
        var hash0 = 0;
        for (var i = 0, len = str.length;
            (i < len);
            (i = (i + 1))) {
            var c = str.charCodeAt(i);
            (hash0 = ((((hash0 << 5) - hash0) + c) | 0));
        }
        return hash0;
    }));
    (empty = ({
        __hamt_isEmpty: true
    }));
    var Leaf = (function(hash0, key, value) {
        var self = this;
        (self.hash = hash0);
        (self.key = key);
        (self.value = value);
    }),
        Collision = (function(hash0, children) {
            var self = this;
            (self.hash = hash0);
            (self.children = children);
        }),
        IndexedNode = (function(mask0, children) {
            var self = this;
            (self.mask = mask0);
            (self.children = children);
        }),
        ArrayNode = (function(count, children) {
            var self = this;
            (self.count = count);
            (self.children = children);
        }),
        isEmpty = (function(x) {
            return (((!x) || (x === empty)) || (x && x.__hamt_isEmpty));
        }),
        isLeaf = (function(node) {
            return (((node === empty) || (node instanceof Leaf)) || (node instanceof Collision));
        }),
        expand = (function(frag, child, bitmap, subNodes) {
            var bit = bitmap,
                arr = [],
                count = 0;
            for (var i = 0; bit;
                (i = (i + 1))) {
                if ((bit & 1)) {
                    (arr[i] = subNodes[count]);
                    (count = (count + 1));
                }
                (bit = (bit >>> 1));
            }
            (arr[frag] = child);
            return new(ArrayNode)((count + 1), arr);
        }),
        pack = (function(removed, elements) {
            var children = [],
                bitmap = 0;
            for (var i = 0, len = elements.length;
                (i < len);
                (i = (i + 1))) {
                var elem = elements[i];
                if (((i !== removed) && (!isEmpty(elem)))) {
                    children.push(elem);
                    (bitmap = (bitmap | (1 << i)));
                }
            }
            return new(IndexedNode)(bitmap, children);
        }),
        mergeLeaves = (function(shift, n1, n2) {
            var subH1, subH2, h1 = n1.hash,
                h2 = n2.hash;
            return ((h1 === h2) ? new(Collision)(h1, [n2, n1]) : ((subH1 = hashFragment(shift, h1)), (subH2 =
                hashFragment(shift, h2)), new(IndexedNode)((toBitmap(subH1) | toBitmap(subH2)), ((
                subH1 === subH2) ? [mergeLeaves((shift + 5), n1, n2)] : ((subH1 < subH2) ? [
                n1, n2
            ] : [n2, n1])))));
        }),
        updateCollisionList = (function(h, list, f, k) {
            var target, i = 0;
            for (var len = list.length;
                (i < len);
                (i = (i + 1))) {
                var child = list[i];
                if ((child.key === k)) {
                    (target = child);
                    break;
                }
            }
            var v = (target ? f(target.value) : f());
            return (isNothing(v) ? arraySpliceOut(i, list) : arrayUpdate(i, new(Leaf)(h, k, v), list));
        });
    (Leaf.prototype.lookup = (function(_, _0, k) {
        var self = this;
        return ((k === self.key) ? self.value : nothing);
    }));
    (Collision.prototype.lookup = (function(_, h, k) {
        var self = this;
        if ((h === self.hash)) {
            var children = self.children;
            for (var i = 0, len = children.length;
                (i < len);
                (i = (i + 1))) {
                var child = children[i];
                if ((k === child.key)) return child.value;
            }
        }
        return nothing;
    }));
    (IndexedNode.prototype.lookup = (function(shift, h, k) {
        var self = this,
            frag = hashFragment(shift, h),
            bit = toBitmap(frag);
        return ((self.mask & bit) ? self.children[fromBitmap(self.mask, bit)].lookup((shift + 5), h, k) :
            nothing);
    }));
    (ArrayNode.prototype.lookup = (function(shift, h, k) {
        var self = this,
            frag = hashFragment(shift, h),
            child = self.children[frag];
        return child.lookup((shift + 5), h, k);
    }));
    (empty.lookup = (function() {
        return nothing;
    }));
    (Leaf.prototype.modify = (function(shift, f, h, k) {
        var self = this,
            v, v0;
        return ((k === self.key) ? ((v = f(self.value)), (isNothing(v) ? empty : new(Leaf)(h, k, v))) :
            ((v0 = f()), (isNothing(v0) ? self : mergeLeaves(shift, self, new(Leaf)(h, k, v0)))));
    }));
    (Collision.prototype.modify = (function(shift, f, h, k) {
        var self = this,
            hash0 = self["hash"],
            children = self["children"],
            list, v;
        return ((h === hash0) ? ((list = updateCollisionList(hash0, children, f, k)), ((list.length > 1) ?
            new(Collision)(hash0, list) : list[0])) : ((v = f()), (isNothing(v) ? self :
            mergeLeaves(shift, self, new(Leaf)(h, k, v)))));
    }));
    (IndexedNode.prototype.modify = (function(shift, f, h, k) {
        var __o = this,
            mask0 = __o["mask"],
            children = __o["children"],
            frag = hashFragment(shift, h),
            bit = toBitmap(frag),
            indx = fromBitmap(mask0, bit),
            exists = (mask0 & bit),
            child = (exists ? children[indx] : empty)
                .modify((shift + 5), f, h, k),
            removed = (exists && isEmpty(child)),
            added = ((!exists) && (!isEmpty(child))),
            bitmap = (removed ? (mask0 & (~bit)) : (added ? (mask0 | bit) : mask0));
        return ((!bitmap) ? empty : (removed ? (((children.length <= 2) && isLeaf(children[(indx ^ 1)])) ?
                children[(indx ^ 1)] : new(IndexedNode)(bitmap, arraySpliceOut(indx, children))) :
            (added ? ((children.length >= MAX_INDEX_NODE) ? expand(frag, child, mask0, children) :
                new(IndexedNode)(bitmap, arraySpliceIn(indx, child, children))) : new(
                IndexedNode)(bitmap, arrayUpdate(indx, child, children)))));
    }));
    (ArrayNode.prototype.modify = (function(shift, f, h, k) {
        var __o = this,
            count = __o["count"],
            children = __o["children"],
            frag = hashFragment(shift, h),
            child = children[frag],
            newChild = (child || empty)
                .modify((shift + 5), f, h, k);
        return ((isEmpty(child) && (!isEmpty(newChild))) ? new(ArrayNode)((count + 1), arrayUpdate(frag,
            newChild, children)) : (((!isEmpty(child)) && isEmpty(newChild)) ? (((count - 1) <=
            MIN_ARRAY_NODE) ? pack(frag, children) : new(ArrayNode)((count - 1),
            arrayUpdate(frag, empty, children))) : new(ArrayNode)(count, arrayUpdate(frag,
            newChild, children))));
    }));
    (empty.modify = (function(_, f, h, k) {
        var v = f();
        return (isNothing(v) ? empty : new(Leaf)(h, k, v));
    }));
    (tryGetHash = (function(alt, h, k, m) {
        return maybe(m.lookup(0, h, k), alt);
    }));
    (tryGet = (function(alt, k, m) {
        var h = hash(k);
        return maybe(m.lookup(0, h, k), alt);
    }));
    (getHash = (function(h, k, m) {
        return maybe(m.lookup(0, h, k), null);
    }));
    (get = (function(k, m) {
        var h = hash(k);
        return maybe(m.lookup(0, h, k), null);
    }));
    (hasHash = (function(h, k, m) {
        return (!isNothing(maybe(m.lookup(0, h, k), nothing)));
    }));
    (has = (function(k, m) {
        var h = hash(k);
        return (!isNothing(maybe(m.lookup(0, h, k), nothing)));
    }));
    (modifyHash = (function(h, k, f, m) {
        return m.modify(0, f, h, k);
    }));
    (modify = (function(k, f, m) {
        var h = hash(k);
        return m.modify(0, f, h, k);
    }));
    (setHash = (function(h, k, v, m) {
        var f = (function() {
            return v;
        });
        return m.modify(0, f, h, k);
    }));
    (set = (function(k, v, m) {
        var h = hash(k),
            f = (function() {
                return v;
            });
        return m.modify(0, f, h, k);
    }));
    var del = (function() {
        return nothing;
    });
    (removeHash = (function(h, k, m) {
        var f = del;
        return m.modify(0, del, h, k);
    }));
    (remove = (function(k, m) {
        return removeHash(hash(k), k, m);
    }));
    (Leaf.prototype.fold = (function(f, z) {
        var self = this;
        return f(z, self);
    }));
    (Collision.prototype.fold = (function(f, z) {
        var __o = this,
            children = __o["children"];
        return children.reduce(f, z);
    }));
    (IndexedNode.prototype.fold = (function(f, z) {
        var __o = this,
            children = __o["children"],
            z1 = z;
        for (var i = 0, len = children.length;
            (i < len);
            (i = (i + 1))) {
            var c = children[i];
            (z1 = ((c instanceof Leaf) ? f(z1, c) : c.fold(f, z1)));
        }
        return z1;
    }));
    (ArrayNode.prototype.fold = (function(f, z) {
        var __o = this,
            children = __o["children"],
            z1 = z;
        for (var i = 0, len = children.length;
            (i < len);
            (i = (i + 1))) {
            var c = children[i];
            if ((!isEmpty(c))) {
                (z1 = ((c instanceof Leaf) ? f(z1, c) : c.fold(f, z1)));
            }
        }
        return z1;
    }));
    (fold = (function(f, z, m) {
        return (isEmpty(m) ? z : m.fold(f, z));
    }));
    var inc = (function(x) {
        return (x + 1);
    });
    (count = (function(m) {
        var f = inc;
        return (isEmpty(m) ? 0 : m.fold(f, 0));
    }));
    var buildPairs = (function(p, x) {
        p.push(x);
        return p;
    });
    (pairs = (function(m) {
        var f = buildPairs,
            z = [];
        return (isEmpty(m) ? z : m.fold(f, z));
    }));
    var buildKeys = (function(p, __o) {
        var key = __o["key"];
        p.push(key);
        return p;
    });
    (keys = (function(m) {
        var f = buildKeys,
            z = [];
        return (isEmpty(m) ? z : m.fold(f, z));
    }));
    var buildValues = (function(p, __o) {
        var value = __o["value"];
        p.push(value);
        return p;
    });
    (values = (function(m) {
        var f = buildValues,
            z = [];
        return (isEmpty(m) ? z : m.fold(f, z));
    }));
    (exports["hash"] = hash);
    (exports["empty"] = empty);
    (exports["tryGetHash"] = tryGetHash);
    (exports["tryGet"] = tryGet);
    (exports["getHash"] = getHash);
    (exports["get"] = get);
    (exports["hasHash"] = hasHash);
    (exports["has"] = has);
    (exports["setHash"] = setHash);
    (exports["set"] = set);
    (exports["modifyHash"] = modifyHash);
    (exports["modify"] = modify);
    (exports["removeHash"] = removeHash);
    (exports["remove"] = remove);
    (exports["fold"] = fold);
    (exports["count"] = count);
    (exports["pairs"] = pairs);
    (exports["keys"] = keys);
    (exports["values"] = values);
}));
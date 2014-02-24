/*
 * THIS FILE IS AUTO GENERATED from 'lib/hamt.kep'
 * DO NOT EDIT
*/
define(["require", "exports"], (function(require, exports) {
    "use strict";
    var hash, empty, tryGetHash, tryGet, getHash, get, hasHash, has, setHash, set, modifyHash, modify,
            removeHash, remove, fold, count, pairs, keys, values, x, m1, m2, m4, x0, size = 5,
        BUCKET_SIZE = Math.pow(2, size),
        mask = (BUCKET_SIZE - 1),
        maxIndexNode = (BUCKET_SIZE / 2),
        minArrayNode = (BUCKET_SIZE / 4),
        constant = (function(x) {
            return (function() {
                return x;
            });
        }),
        nothing = ({}),
        isNothing = ((x = nothing), (function(y) {
            return (x === y);
        })),
        maybe = (function(val, def) {
            return (isNothing(val) ? def : val);
        }),
        popcount = ((m1 = 1431655765), (m2 = 858993459), (m4 = 252645135), (function(x) {
            var x0 = (x - ((x >> 1) & m1)),
                x1 = ((x0 & m2) + ((x0 >> 2) & m2)),
                x2 = ((x1 + (x1 >> 4)) & m4),
                x3 = (x2 + (x2 >> 8)),
                x4 = (x3 + (x3 >> 16));
            return (x4 & 127);
        })),
        hashFragment = (function(shift, h) {
            return ((h >>> shift) & mask);
        }),
        toBitmap = (function(frag) {
            return (1 << frag);
        }),
        fromBitmap = (function(bitmap, bit) {
            return popcount((bitmap & (toBitmap(bit) - 1)));
        }),
        arrayUpdate = (function(at, v, arr) {
            var out = arr.slice();
            (out[at] = v);
            return out;
        }),
        arraySpliceOut = (function(at, arr) {
            var out = arr.slice();
            out.splice(at, 1);
            return out;
        }),
        arraySpliceIn = (function(at, v, arr) {
            var out = arr.slice();
            out.splice(at, 0, v);
            return out;
        });
    (hash = (function(str) {
        if (((typeof str) === "number")) return str;
        var hash = 0;
        for (var i = 0, len = str.length;
            (i < len);
            (i = (i + 1))) {
            var c = str.charCodeAt(i);
            (hash = ((((hash << 5) - hash) + c) | 0));
        }
        return hash;
    }));
    (empty = null);
    var Leaf = (function(hash, key, value) {
        var self = this;
        (self.hash = hash);
        (self.key = key);
        (self.value = value);
    }),
        Collision = (function(hash, children) {
            var self = this;
            (self.hash = hash);
            (self.children = children);
        }),
        IndexedNode = (function(mask, children) {
            var self = this;
            (self.mask = mask);
            (self.children = children);
        }),
        ArrayNode = (function(count, children) {
            var self = this;
            (self.count = count);
            (self.children = children);
        }),
        isEmpty = (function(x) {
            return (!x);
        }),
        isLeaf = (function(node) {
            return (((node === empty) || (node instanceof Leaf)) || (node instanceof Collision));
        }),
        expand = (function(frag, child, bitmap, subNodes) {
            var bit = bitmap,
                arr = [],
                count = 0;
            for (var i = 0;
                (i < BUCKET_SIZE);
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
            var h1 = n1.hash,
                subH1, subH2, h2 = n2.hash;
            return ((h1 === h2) ? new(Collision)(h1, [n2, n1]) : ((subH1 = hashFragment(shift, h1)), (subH2 =
                hashFragment(shift, h2)), new(IndexedNode)((toBitmap(subH1) | toBitmap(subH2)), ((
                subH1 === subH2) ? [mergeLeaves((shift + size), n1, n2)] : ((subH1 < subH2) ? [
                n1, n2
            ] : [n2, n1])))));
        }),
        updateCollisionList = (function(list, f, k) {
            var first, rest, v;
            return ((!list.length) ? [] : ((first = list[0]), (rest = list.slice(1)), ((first.key === k) ?
                ((v = f(first.value)), (isNothing(v) ? rest : [v].concat(rest))) : [first].concat(
                    updateCollisionList(rest, f, k)))));
        }),
        lookup;
    (Leaf.prototype.lookup = (function(_, _0, k) {
        var self = this;
        return ((k === self.key) ? self.value : nothing);
    }));
    (Collision.prototype.lookup = (function(_, _0, k) {
        var self = this;
        for (var i = 0, len = self.children.length;
            (i < len);
            (i = (i + 1))) {
            var __o = self.children[i],
                key = __o["key"],
                value = __o["value"];
            if ((k === key)) return value;
        }
        return nothing;
    }));
    (IndexedNode.prototype.lookup = (function(shift, h, k) {
        var self = this,
            frag = hashFragment(shift, h);
        return ((self.mask & toBitmap(frag)) ? lookup(self.children[fromBitmap(self.mask, frag)], (
            shift + size), h, k) : nothing);
    }));
    (ArrayNode.prototype.lookup = (function(shift, h, k) {
        var self = this,
            frag = hashFragment(shift, h),
            child = self.children[frag];
        return lookup(child, (shift + size), h, k);
    }));
    (lookup = (function(n, shift, h, k) {
        return (isEmpty(n) ? nothing : n.lookup(shift, h, k));
    }));
    var alter;
    (Leaf.prototype.modify = (function(shift, f, h, k) {
        var v, v0, self = this;
        return ((k === self.key) ? ((v = f(self.value)), (isNothing(v) ? empty : new(Leaf)(h, k, v))) :
            ((v0 = f()), (isNothing(v0) ? self : mergeLeaves(shift, self, new(Leaf)(h, k, v0)))));
    }));
    (Collision.prototype.modify = (function(shift, f, h, k) {
        var self = this,
            list = updateCollisionList(self.children, f, k);
        return ((list.length > 1) ? new(Collision)(self.hash, list) : list[0]);
    }));
    (IndexedNode.prototype.modify = (function(shift, f, h, k) {
        var self = this,
            frag = hashFragment(shift, h),
            bit = toBitmap(frag),
            indx = fromBitmap(self.mask, frag),
            exists = (self.mask & bit),
            child = alter((exists ? self.children[indx] : empty), (shift + size), f, h, k),
            removed = (exists && isEmpty(child)),
            added = ((!exists) && (!isEmpty(child))),
            subNodes, bitmap = (removed ? (self.mask & (~bit)) : (added ? (self.mask | bit) : self.mask));
        return ((!bitmap) ? empty : ((subNodes = (removed ? arraySpliceOut(indx, self.children) : (
            added ? arraySpliceIn(indx, child, self.children) : arrayUpdate(indx, child,
                self.children)))), (((subNodes.length <= 1) && isLeaf(subNodes[0])) ? subNodes[
            0] : ((subNodes.length >= maxIndexNode) ? expand(frag, child, bitmap, subNodes) :
            new(IndexedNode)(bitmap, subNodes)))));
    }));
    (ArrayNode.prototype.modify = (function(shift, f, h, k) {
        var self = this,
            frag = hashFragment(shift, h),
            child = self.children[frag],
            newChild = alter(child, (shift + size), f, h, k);
        return ((isEmpty(child) && (!isEmpty(newChild))) ? new(ArrayNode)((self.count + 1), arrayUpdate(
            frag, newChild, self.children)) : (((!isEmpty(child)) && isEmpty(newChild)) ? (((self.count -
            1) <= minArrayNode) ? pack(frag, self.children) : new(ArrayNode)((self.count -
            1), arrayUpdate(frag, empty, self.children))) : new(ArrayNode)(self.count,
            arrayUpdate(frag, newChild, self.children))));
    }));
    (alter = (function(n, shift, f, h, k) {
        var v;
        return (isEmpty(n) ? ((v = f()), (isNothing(v) ? empty : new(Leaf)(h, k, v))) : n.modify(shift,
            f, h, k));
    }));
    (tryGetHash = (function(alt, h, k, m) {
        return maybe(lookup(m, 0, h, k), alt);
    }));
    (tryGet = (function(alt, k, m) {
        return tryGetHash(alt, hash(k), k, m);
    }));
    (getHash = (function(h, k, m) {
        return maybe(lookup(m, 0, h, k), null);
    }));
    (get = (function(k, m) {
        return getHash(hash(k), k, m);
    }));
    (hasHash = (function(h, k, m) {
        return (!isNothing(lookup(m, 0, h, k)));
    }));
    (has = (function(k, m) {
        return hasHash(hash(k), k, m);
    }));
    (modifyHash = (function(h, k, f, m) {
        return alter(m, 0, f, h, k);
    }));
    (modify = (function(k, f, m) {
        return modifyHash(hash(k), k, f, m);
    }));
    (setHash = (function(h, k, v, m) {
        return modifyHash(h, k, constant(v), m);
    }));
    (set = (function(k, v, m) {
        return setHash(hash(k), k, v, m);
    }));
    var del = constant(nothing);
    (removeHash = (function(h, k, m) {
        return modifyHash(h, k, del, m);
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
            if (c)(z1 = ((c instanceof Leaf) ? f(z1, c) : c.fold(f, z1)));
        }
        return z1;
    }));
    (fold = (function(f, z, m) {
        return (isEmpty(m) ? z : m.fold(f, z));
    }));
    (count = fold.bind(null, ((x0 = 1), (function(y) {
        return (x0 + y);
    })), 0));
    var build = (function(p, __o) {
        var key = __o["key"],
            value = __o["value"];
        p.push([key, value]);
        return p;
    });
    (pairs = (function(m) {
        return fold(build, [], m);
    }));
    var build0 = (function(p, __o) {
        var key = __o["key"];
        p.push(key);
        return p;
    });
    (keys = (function(m) {
        return fold(build0, [], m);
    }));
    var build1 = (function(p, __o) {
        var value = __o["value"];
        p.push(value);
        return p;
    });
    (values = (function(m) {
        return fold(build1, [], m);
    }));
    (exports.hash = hash);
    (exports.empty = empty);
    (exports.tryGetHash = tryGetHash);
    (exports.tryGet = tryGet);
    (exports.getHash = getHash);
    (exports.get = get);
    (exports.hasHash = hasHash);
    (exports.has = has);
    (exports.setHash = setHash);
    (exports.set = set);
    (exports.modifyHash = modifyHash);
    (exports.modify = modify);
    (exports.removeHash = removeHash);
    (exports.remove = remove);
    (exports.fold = fold);
    (exports.count = count);
    (exports.pairs = pairs);
    (exports.keys = keys);
    (exports.values = values);
}));
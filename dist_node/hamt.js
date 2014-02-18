/*
 * THIS FILE IS AUTO GENERATED from 'lib/hamt.kep'
 * DO NOT EDIT
*/
"use strict";
var hash, empty, getHash, get, setHash, set, modifyHash, modify, removeHash, remove, size = 5,
    mask = (Math.pow(2, size) - 1),
    maxIndexNode = (Math.pow(2, size) / 2),
    minArrayNode = (Math.pow(2, size) / 4),
    constant = (function(x) {
        return (function() {
            return x;
        });
    }),
    nothing = null,
    isNothing = (function(x, y) {
        return (x === y);
    })
        .bind(null, nothing),
    popcount = (function() {
        var m1 = 1431655765,
            m2 = 858993459,
            m4 = 252645135;
        return (function(num) {
            var x = num;
            (x = (x - ((x >> 1) & m1)));
            (x = ((x & m2) + ((x >> 2) & m2)));
            (x = ((x + (x >> 4)) & m4));
            (x = (x + (x >> 8)));
            (x = (x + (x >> 16)));
            return (x & 127);
        });
    })(),
    hashFragment = (function(shift, h) {
        return ((h >>> shift) & mask);
    }),
    toBitmap = (function(frag) {
        return (1 << frag);
    }),
    fromBitmap = (function(bitmap, bit) {
        return popcount((bitmap & (toBitmap(bit) - 1)));
    }),
    split = (function(at, arr) {
        return [arr.slice(0, at), arr.slice(at)];
    }),
    rest = (function(arr) {
        return arr.slice(1);
    }),
    arrayUpdate = (function(at, v, arr) {
        var out = [];
        for (var i = 0, len = arr.length;
            (i < len);
            (i = (i + 1)))(out[i] = arr[i]);
        (out[at] = v);
        return out;
    });
(hash = (function(str) {
    var hash = 0;
    for (var i = 0, len = str.length;
        (i < len);
        (i = (i + 1))) {
        var char = str.charCodeAt(i);
        (hash = ((((hash << 5) - hash) + char) | 0));
    }
    return hash;
}));
(empty = ({}));
var Leaf = (function(hash, key, value) {
    var self = this;
    (self.hash = hash);
    (self.key = key);
    (self.value = value);
}),
    Collision = (function(hash, list) {
        var self = this;
        (self.hash = hash);
        (self.list = list);
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
    isEmpty = (function(x, y) {
        return (x === y);
    })
        .bind(null, empty),
    isLeaf = (function(node) {
        return (((node === empty) || (node instanceof Leaf)) || (node instanceof Collision));
    }),
    expand = (function(frag, child, bitmap, subNodes) {
        var bit = bitmap,
            arr = [],
            count = 0;
        for (var i = 0;
            (i < 32);
            (i = (i + 1))) {
            if ((bit & 1)) {
                (arr[i] = subNodes[count]);
                (count = (count + 1));
            } else {
                (arr[i] = empty);
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
        return (isEmpty(n2) ? n1 : (function() {
            var h1 = n1.hash,
                h2 = n2.hash;
            return ((h1 === h2) ? new(Collision)(h1, [
                [n2.key, n2.value],
                [n1.key, n1.value]
            ]) : (function() {
                var subH1 = hashFragment(shift, h1),
                    subH2 = hashFragment(shift, h2);
                return new(IndexedNode)((toBitmap(subH1) | toBitmap(subH2)), ((subH1 === subH2) ? [
                    mergeLeaves((shift + size), n1, n2)
                ] : ((subH1 < subH2) ? [n1, n2] : [n2, n1])));
            })());
        })());
    }),
    updateCollisionList = (function(list, f, k) {
        return ((!list.length) ? [] : (function() {
            var first = list[0],
                rest = list.slice(1);
            return ((first[0] === k) ? (function() {
                var v = f(first);
                return (isNothing(v) ? rest : [v].concat(rest));
            })() : [first].concat(updateCollisionList(rest, f, k)));
        })());
    });
(empty.get = (function(_, _0, _1) {
    return nothing;
}));
(Leaf.prototype.get = (function(_, _0, k) {
    var self = this;
    return ((k === self.key) ? self.value : nothing);
}));
(Collision.prototype.get = (function(_, _0, k) {
    var self = this;
    for (var i = 0, len = self.list.length;
        (i < len);
        (i = (i + 1))) {
        var __o = self.list[i],
            key = __o[0],
            value = __o[1];
        if ((k === key)) return value;
    }
    return nothing;
}));
(IndexedNode.prototype.get = (function(shift, h, k) {
    var self = this,
        frag = hashFragment(shift, h);
    return ((self.mask & toBitmap(frag)) ? self.children[fromBitmap(self.mask, frag)].get((shift + size), h, k) :
        nothing);
}));
(ArrayNode.prototype.get = (function(shift, h, k) {
    var self = this,
        frag = hashFragment(shift, h),
        child = self.children[frag];
    return child.get((shift + size), h, k);
}));
(empty.modify = (function(_, f, h, k) {
    var v = f(nothing);
    return (isNothing(v) ? empty : new(Leaf)(h, k, v));
}));
(Leaf.prototype.modify = (function(shift, f, h, k) {
    var self = this;
    return ((k === self.key) ? (function() {
        var v = f(self.value);
        return (isNothing(v) ? empty : new(Leaf)(h, k, v));
    })() : mergeLeaves(shift, self, empty.modify(shift, f, h, k)));
}));
(Collision.prototype.modify = (function(shift, f, h, k) {
    var self = this,
        list = updateCollisionList(self.list, f, k);
    return ((list.length > 1) ? new(Collision)(self.hash, list) : new(Leaf)(h, list[0][0], list[0][1]));
}));
(IndexedNode.prototype.modify = (function(shift, f, h, k) {
    var self = this,
        frag = hashFragment(shift, h),
        bit = toBitmap(frag),
        indx = fromBitmap(self.mask, frag),
        exists = (self.mask & bit),
        child = (exists ? self.children[indx] : empty)
            .modify((shift + size), f, h, k),
        removed = (exists && isEmpty(child)),
        added = ((!exists) && (!isEmpty(child))),
        bound = (removed ? (self.children.length - 1) : (added ? (self.children.length + 1) : self.children.length)),
        __o = split(indx, self.children),
        left = __o[0],
        right = __o[1],
        subNodes = (removed ? left.concat(rest(right)) : (added ? left.concat([child], right) : arrayUpdate(
            indx, child, self.children))),
        bitmap = (removed ? (self.mask & (~bit)) : (added ? (self.mask | bit) : self.mask));
    return ((!bitmap) ? empty : (((bound === 0) && isLeaf(self.children[0])) ? self.children[0] : ((added && (
        bound >= maxIndexNode)) ? expand(frag, child, bitmap, subNodes) : new(IndexedNode)(bitmap,
        subNodes))));
}));
(ArrayNode.prototype.modify = (function(shift, f, h, k) {
    var self = this,
        frag = hashFragment(shift, h),
        child = self.children[frag],
        newChild = child.modify((shift + size), f, h, k),
        removed = ((child !== empty) && isEmpty(newChild)),
        added = ((child === empty) && (!isEmpty(newChild)));
    return (added ? new(ArrayNode)((self.count + 1), arrayUpdate(frag, newChild, self.children)) : (removed ? (
        ((self.count - 1) <= minArrayNode) ? pack(frag, self.children) : new(ArrayNode)((self.count - 1),
            arrayUpdate(frag, empty, self.children))) : new(ArrayNode)(self.count, arrayUpdate(frag,
        newChild, self.children))));
}));
(getHash = (function(h, k, m) {
    return m.get(0, h, k);
}));
(get = (function(k, m) {
    return getHash(hash(k), k, m);
}));
(modifyHash = (function(h, k, f, m) {
    return m.modify(0, f, h, k);
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
(exports.hash = hash);
(exports.empty = empty);
(exports.getHash = getHash);
(exports.get = get);
(exports.setHash = setHash);
(exports.set = set);
(exports.modifyHash = modifyHash);
(exports.modify = modify);
(exports.removeHash = removeHash);
(exports.remove = remove);
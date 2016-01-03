/*
 * THIS FILE IS AUTO GENERATED FROM 'lib/hamt.kep'
 * DO NOT EDIT
*/
"use strict";
var hamt = ({}),
    constant = (function(x) {
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
    popcount = (function(_x) {
        var x = (_x - ((_x >> 1) & 1431655765));
        (x = ((x & 858993459) + ((x >> 2) & 858993459)));
        (x = ((x + (x >> 4)) & 252645135));
        (x = (x + (x >> 8)));
        (x = (x + (x >> 16)));
        return (x & 127);
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
    }),
    hash = (function(str) {
        if (((typeof str) === "number")) return str;
        var hash0 = 0;
        for (var i = 0, len = str.length;
            (i < len);
            (i = (i + 1))) {
            var c = str.charCodeAt(i);
            (hash0 = ((((hash0 << 5) - hash0) + c) | 0));
        }
        return hash0;
    });
(hamt.hash = hash);
var empty = ({
    __hamt_isEmpty: true
});
(hamt.empty = empty);
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
    mergeLeaves = (function(shift, h1, n1, h2, n2) {
        if ((h1 === h2)) return new(Collision)(h1, [n2, n1]);
        var subH1 = hashFragment(shift, h1),
            subH2 = hashFragment(shift, h2);
        return new(IndexedNode)((toBitmap(subH1) | toBitmap(subH2)), ((subH1 === subH2) ? [mergeLeaves((shift + 5),
            h1, n1, h2, n2)] : ((subH1 < subH2) ? [n1, n2] : [n2, n1])));
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
    return ((self.mask & bit) ? self.children[fromBitmap(self.mask, bit)].lookup((shift + 5), h, k) : nothing);
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
    var self = this;
    if ((k === self.key)) {
        var v = f(self.value);
        return (isNothing(v) ? empty : new(Leaf)(h, k, v));
    }
    var v0 = f();
    return (isNothing(v0) ? self : mergeLeaves(shift, self.hash, self, h, new(Leaf)(h, k, v0)));
}));
(Collision.prototype.modify = (function(shift, f, h, k) {
    var self = this;
    if ((h === self.hash)) {
        var list = updateCollisionList(self.hash, self.children, f, k);
        return ((list.length > 1) ? new(Collision)(self.hash, list) : list[0]);
    }
    var v = f();
    return (isNothing(v) ? self : mergeLeaves(shift, self.hash, self, h, new(Leaf)(h, k, v)));
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
    return ((!bitmap) ? empty : (removed ? (((children.length <= 2) && isLeaf(children[(indx ^ 1)])) ? children[
        (indx ^ 1)] : new(IndexedNode)(bitmap, arraySpliceOut(indx, children))) : (added ? ((children.length >=
        MAX_INDEX_NODE) ? expand(frag, child, mask0, children) : new(IndexedNode)(bitmap,
        arraySpliceIn(indx, child, children))) : new(IndexedNode)(bitmap, arrayUpdate(indx, child,
        children)))));
}));
(ArrayNode.prototype.modify = (function(shift, f, h, k) {
    var self = this,
        count = self.count,
        children = self.children,
        frag = hashFragment(shift, h),
        child = children[frag],
        newChild = (child || empty)
            .modify((shift + 5), f, h, k);
    return ((isEmpty(child) && (!isEmpty(newChild))) ? new(ArrayNode)((count + 1), arrayUpdate(frag, newChild,
        children)) : (((!isEmpty(child)) && isEmpty(newChild)) ? (((count - 1) <= MIN_ARRAY_NODE) ? pack(
        frag, children) : new(ArrayNode)((count - 1), arrayUpdate(frag, empty, children))) : new(
        ArrayNode)(count, arrayUpdate(frag, newChild, children))));
}));
(empty.modify = (function(_, f, h, k) {
    var v = f();
    return (isNothing(v) ? empty : new(Leaf)(h, k, v));
}));
var tryGetHash = (function(alt, h, k, m) {
    return maybe(m.lookup(0, h, k), alt);
});
(hamt.tryGetHash = tryGetHash);
var tryGet = (function(alt, k, m) {
    return tryGetHash(alt, hash(k), k, m);
});
(hamt.tryGet = tryGet);
var getHash = (function(h, k, m) {
    return tryGetHash(null, h, k, m);
});
(hamt.getHash = getHash);
var get = (function(k, m) {
    return tryGet(null, k, m);
});
(hamt.get = get);
var hasHash = (function(h, k, m) {
    return (!isNothing(tryGetHash(nothing, h, k, m)));
});
(hamt.hasHash = hasHash);
var has = (function(k, m) {
    return hasHash(hash(k), k, m);
});
(hamt.has = has);
var modifyHash = (function(h, k, f, m) {
    return m.modify(0, f, h, k);
});
(hamt.modifyHash = modifyHash);
var modify = (function(k, f, m) {
    return modifyHash(hash(k), k, f, m);
});
(hamt.modify = modify);
var setHash = (function(h, k, v, m) {
    return modifyHash(h, k, (function() {
        return v;
    }), m);
});
(hamt.setHash = setHash);
var set = (function(k, v, m) {
    return setHash(hash(k), k, v, m);
});
(hamt.set = set);
var del = (function() {
    return nothing;
}),
    removeHash = (function(h, k, m) {
        return modifyHash(h, k, del, m);
    });
(hamt.removeHash = removeHash);
var remove = (function(k, m) {
    return removeHash(hash(k), k, m);
});
(hamt.remove = remove);
(Leaf.prototype.fold = (function(f, z) {
    var self = this;
    return f(z, self);
}));
(Collision.prototype.fold = (function(f, z) {
    var self = this;
    return self.children.reduce(f, z);
}));
(IndexedNode.prototype.fold = (function(f, z) {
    var self = this,
        z1 = z,
        children = self.children;
    for (var i = 0, len = children.length;
        (i < len);
        (i = (i + 1))) {
        var c = children[i];
        (z1 = ((c instanceof Leaf) ? f(z1, c) : c.fold(f, z1)));
    }
    return z1;
}));
(ArrayNode.prototype.fold = (function(f, z) {
    var self = this,
        z1 = z,
        children = self.children;
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
var fold = (function(f, z, m) {
    return (isEmpty(m) ? z : m.fold(f, z));
});
(hamt.fold = fold);
var inc = (function(x) {
    return (x + 1);
}),
    count = (function(m) {
        return fold(inc, 0, m);
    });
(hamt.count = count);
var buildPairs = (function(p, x) {
    p.push(x);
    return p;
}),
    pairs = (function(m) {
        return fold(buildPairs, [], m);
    });
(hamt.pairs = pairs);
var buildKeys = (function(p, __o) {
    var key = __o["key"];
    p.push(key);
    return p;
}),
    keys = (function(m) {
        return fold(buildKeys, [], m);
    });
(hamt.keys = keys);
var buildValues = (function(p, __o) {
    var value = __o["value"];
    p.push(value);
    return p;
}),
    values = (function(m) {
        return fold(buildValues, [], m);
    });
(hamt.values = values);
if ((((typeof module) !== "undefined") && module.exports)) {
    (module.exports = hamt);
} else if ((((typeof define) == "function") && define.amd)) {
    define("hamt", [], (function() {
        return hamt;
    }));
}
var hamt = require('../dist_node/hamt');


exports.single = function(test) {
    var h = hamt.set('a', 3, hamt.empty);
    test.equal(hamt.get('a', h), 3);
    
    test.done();
};

exports.get_non_existant_empty = function(test) {
    test.equal(hamt.get('a', hamt.empty), null);
    
    test.done();
};

exports.multiple = function(test) {
    var h1 = hamt.set('a', 3, hamt.empty);
    var h2 = hamt.set('b', 5, h1);
    
    test.equal(hamt.get('a', h2), 3);
    test.equal(hamt.get('b', h2), 5);
    
    test.done();
};

exports.set_does_not_alter_original = function(test) {
    var h1 = hamt.set('a', 3, hamt.empty);
    var h2 = hamt.set('b', 5, h1);
    
    test.equal(hamt.get('a', h1), 3);
    test.equal(hamt.get('b', h1), null);
    
    test.equal(hamt.get('a', h2), 3);
    test.equal(hamt.get('b', h2), 5)
    ;
    test.done();
};


exports.collision = function(test) {
    var h1 = hamt.setHash(0, 'a', 3, hamt.empty);
    var h2 = hamt.setHash(0, 'b', 5, h1);
    
    test.equal(hamt.getHash(0, 'a', h2), 3);
    test.equal(hamt.getHash(0, 'b', h2), 5);
    
    test.done();
};

exports.many_unorder = function(test) {
    var arr = ["n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
               "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
               "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
               "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
               "u", "I", "O", "`", "X"];
    
    var h = hamt.empty;
    arr.forEach(function(x) {
        h = hamt.set(x, x, h);
    });
    
    arr.forEach(function(x) {
        test.equal(
            hamt.get(x, h),
            x);
    });

    
    test.done();
};

exports.many_ordered = function(test) {
    var h = hamt.empty;
    for (var i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
        h = hamt.set(String.fromCharCode(i), i, h);
    }

    for (var i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
        test.equal(
            hamt.get(String.fromCharCode(i), h),
            i);
    }
    
    test.done();
};
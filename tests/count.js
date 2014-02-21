var hamt = require('../dist_node/hamt');

exports.empty = function(test) {
    test.equal(hamt.count(hamt.empty), 0);

    test.done();
};

exports.simple_count = function(test) {
    var h1 = hamt.set('b', 5, hamt.set('a', 3, hamt.empty));
    
    test.equal(hamt.count(h1), 2);

    test.done();
};

exports.collision = function(test) {
    var h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
    
    test.equal(hamt.count(h1), 2);
    
    test.done();
};

exports.many = function(test) {
    var insert = ["n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
               "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
               "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
               "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
               "u", "I", "O", "`", "X"];
    
    var remove = ["w", "m", "Q", "R", "i", "K", "P", "Y", "D", "g", "y", "L",
                  "b", "[", "a", "t", "j", "W", "J", "G", "q", "r", "p", "U",
                  "v", "h", "S", "_", "d", "x", "I", "F", "f", "n", "B", "\\",
                  "k", "V", "N", "l", "X", "A", "]", "s", "Z", "O", "^", "o",
                  "`", "H", "E", "e", "M", "u", "T", "c", "C"];
    
    var h = hamt.empty;
    
    for (var i = 0; i < insert.length; ++i) {
        var x = insert[i];
        h = hamt.set(x, x, h);
        test.equal(
            hamt.count(h),
            i + 1);
    }
    
    for (var i = 0; i < remove.length; ++i) {
        h = hamt.remove(remove[i], h);
        test.equal(
            hamt.count(h),
            remove.length - i - 1);
    }
    test.done();
};

var hamt = require('../dist_node/hamt');


exports.single = function(test) {
    var h = hamt.set('a', 3, hamt.empty);
    var h1 = hamt.modify('a', function(x) { return x * 2 }, h);

    test.equal(hamt.get('a', h1), 6);
    
    test.done();
};

exports.non_existant = function(test) {
    var h = hamt.modify('a', function(x) { return 10; }, hamt.empty);
    test.equal(hamt.get('a', h), 10);
    
    test.done();
};

exports.collision = function(test) {
    var h1 = hamt.setHash(0, 'a', 3, hamt.empty);
    var h2 = hamt.setHash(0, 'b', 5, h1);
    
    var h3 = hamt.modifyHash(0, 'a', function(x) { return x * 2; }, h2);
    test.equal(hamt.getHash(0, 'a', h3), 6);
    test.equal(hamt.getHash(0, 'b', h3), 5);
    
    var h4 = hamt.modifyHash(0, 'b', function(x) { return x * 2; }, h3);
    test.equal(hamt.getHash(0, 'a', h4), 6);
    test.equal(hamt.getHash(0, 'b', h4), 10);
    
    // Non existant
    var h5 = hamt.modifyHash(0, 'c', function(x) { return 100; }, h4);
    test.equal(hamt.getHash(0, 'a', h5), 6);
    test.equal(hamt.getHash(0, 'b', h5), 10);
    test.equal(hamt.getHash(0, 'c', h5), 100);

    test.done();
};


var hamt = require('../dist_node/hamt');


"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('assert');

describe('count', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], hamt.count(hamt.empty));
    });
    
    it('should return 1 for single element map', () => {
        assert.equal(1, hamt.count(hamt.set('a', 5, hamt.empty)));
        assert.equal(1, hamt.count(hamt.set('b', 5, hamt.empty)));
    });
    
    it('should handle counts on collisions correctly', () => {
        const h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
        assert.equal(2, hamt.count(h1));
    });
    
    it('return correct counts while items are added and removed', () => {
        const insert = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"];
    
        const remove = [
            "w", "m", "Q", "R", "i", "K", "P", "Y", "D", "g", "y", "L",
            "b", "[", "a", "t", "j", "W", "J", "G", "q", "r", "p", "U",
            "v", "h", "S", "_", "d", "x", "I", "F", "f", "n", "B", "\\",
            "k", "V", "N", "l", "X", "A", "]", "s", "Z", "O", "^", "o",
            "`", "H", "E", "e", "M", "u", "T", "c", "C"];
    
            let h = hamt.empty;
    
            for (let i = 0; i < insert.length; ++i) {
                const x = insert[i];
                h = hamt.set(x, x, h);
                assert.equal(i + 1, hamt.count(h));
            }
    
            for (let i = 0; i < remove.length; ++i) {
                h = hamt.remove(remove[i], h);
                assert.equal(remove.length - i - 1, hamt.count(h));
            }
    });
});



var containsAll = function(test, arr, keys) {
    keys.forEach(function(k) {
        test.ok(arr.indexOf(k) >= 0, k);
    });
};


exports.empty = function(test) {
    test.deepEqual(
        hamt.keys(hamt.empty),
        []);

    test.done();
};

exports.simple_keys = function(test) {
    var h1 = hamt.set('b', 5, hamt.set('a', 3, hamt.empty));
    
    containsAll(test,
        hamt.keys(h1),
        ['b', 'a']);

    test.done();
};

exports.collision = function(test) {
    var h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
        
    containsAll(test,
        hamt.keys(h1),
        ['b', 'a']);
    
    test.done();
};

exports.many = function(test) {
    var insert = ["n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
               "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
               "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
               "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
               "u", "I", "O", "`", "X"];
    
    var h = hamt.empty;
    insert.forEach(function(x) {
        h = hamt.set(x, x, h);
    });
    
    containsAll(test,
        hamt.keys(h),
        insert);
    
    test.done();
};

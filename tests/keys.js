"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('chai').assert;

describe('keys', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], hamt.keys(hamt.empty));
    });
    
    it('should return single key for single element map', () => {
        assert.deepEqual(['a'], hamt.keys(hamt.set('a', 5, hamt.empty)));
        assert.deepEqual(['b'], hamt.keys(hamt.set('b', 5, hamt.empty)));
    });
    
    it('should return all keys for collision', () => {
        const h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
        assert.sameMembers(['a', 'b'], hamt.keys(h1));
    });
    
    it('return correct keys while items are added', () => {
        const insert = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"];
    
        let h = hamt.empty;
        insert.forEach(x => {
            h = hamt.set(x, x, h);
        });
    
        assert.sameMembers(insert, hamt.keys(h));
    });
});


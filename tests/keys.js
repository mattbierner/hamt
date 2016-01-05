"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('keys', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], Array.from(hamt.keys(hamt.empty)));
    });
    
    it('should return single key for single element map', () => {
        assert.deepEqual(['a'], Array.from(hamt.keys(hamt.empty.set('a', 5))));
        assert.deepEqual(['b'], Array.from(hamt.empty.set('b', 5).keys()));
    });
    
    it('should return all keys for collision', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);
            
        assert.sameMembers(['a', 'b'], Array.from(h1.keys()));
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
            h = h.set(x, x);
        });
    
        assert.sameMembers(insert, Array.from(hamt.keys(h)));
    });
});


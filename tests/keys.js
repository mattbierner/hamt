"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('keys', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], hamt.keys(hamt.empty));
    });
    
    it('should return single key for single element map', () => {
        assert.deepEqual(['a'], hamt.keys(hamt.empty.set('a', 5)));
        assert.deepEqual(['b'], hamt.empty.set('b', 5).keys());
    });
    
    it('should return all keys for collision', () => {
        const h1 = hamt.empty
            ._modify(0, () => 3, 0, 'a')
            ._modify(0, () => 5, 0, 'b');
            
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
            h = h.set(x, x);
        });
    
        assert.sameMembers(insert, hamt.keys(h));
    });
});


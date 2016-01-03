"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('values', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], hamt.values(hamt.empty));
    });
    
    it('should return single key for single element map', () => {
        assert.deepEqual([3], hamt.values(hamt.empty.set('a', 3)));
        assert.deepEqual([5], hamt.empty.set('b', 5).values());
    });
    
    it('should return all values for collision', () => {
        const h1 = hamt.empty
            ._modify(0, () => 3, 0, 'a')
            ._modify(0, () => 5, 0, 'b');
        assert.sameMembers([5, 3], hamt.values(h1));
    });
    
    it('should return duplicate values', () => {
        const h = hamt.empty.set('b', 3).set('a', 3);
        assert.deepEqual([3, 3], hamt.values(h));
    });
    
    it('return correct values while items are added', () => {
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
    
        assert.sameMembers(insert, hamt.values(h));
    });
});


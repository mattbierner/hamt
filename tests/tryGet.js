"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('tryGet', () => {
    it('should return default for empty map', () => {
        assert.strictEqual(10, hamt.tryGet(10, 'a', hamt.empty));
        assert.strictEqual(10, hamt.empty.tryGet('a', 10));

        assert.strictEqual(10, hamt.tryGet(10, 'b', hamt.empty));
        assert.strictEqual(false, hamt.tryGet(false, 'a', hamt.empty));
        
        const a = {};
        assert.strictEqual(a, hamt.tryGet(a, 'b', hamt.empty));

    });
    
    it('should return default for non-existant value', () => {
        var h1 = hamt.empty.set('a', 3);
    
        assert.strictEqual(3, hamt.tryGet(10, 'a', h1));
        assert.strictEqual(10, hamt.tryGet(10, 'b', h1));
    });
    
    it('should work on array nodes correctly', () => {
        const insert = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"];
    
        let h = hamt.empty;
        for (let i = 0; i < insert.length; ++i) {
            h = h.setHash(i, insert[i], insert[i]);
        }
        
        console.log(h);
        assert.strictEqual(insert.length, h.count());
        
        for (let i = 0; i < insert.length; ++i) {
            const x = insert[i];
            assert.strictEqual(x, h.tryGetHash(i, x, null));
            assert.strictEqual(null, h.tryGetHash(i, x + x, null));
        }
    });
});

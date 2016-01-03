"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('set', () => {
    it('should add entry to empty map', () => {
        const h = hamt.set(3, 'a', hamt.empty);
        assert.strictEqual(3, hamt.get('a', h));
    });
    
    it('should add entry to existing map', () => {
        const h = hamt.empty.set('a', 3);
        const h1 = h.set('b', 5);

        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        
        assert.strictEqual(3, hamt.get('a', h));
        assert.strictEqual(null, hamt.get('b', h));
    });
    
    it('should overwrite entry in existing map', () => {
        const h1 = hamt.empty
            .set('a', 3)
            .set('b', 5)
            .set('c', 10);
        const h2 = h1.set('b', 4);

        assert.strictEqual(3, hamt.get('a', h2));
        assert.strictEqual(4, hamt.get('b', h2));
        assert.strictEqual(10, hamt.get('c', h2));

        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        assert.strictEqual(10, hamt.get('c', h1));
    });
    
    it('should handle collisions correctly', () => {
        const h1 = hamt.empty._modify(0, () => 3, 0, 'a');
        const h2 = h1._modify(0, () => 5, 0, 'b');
    
        assert.strictEqual(3, h2._lookup(0, 0, 'a'));
        assert.strictEqual(5, h2._lookup(0, 0, 'b'));
    });
        
    
    it('should add to collisions correctly', () => {
        const h1 = hamt.empty._modify(0, () => 3, 0, 'a');
        const h2 = h1._modify(0, () => 5, 0, 'b');
        const h3 = h2._modify(0, () => 7, 1, 'c');
    
        assert.strictEqual(3, h3._lookup(0, 0, 'a'));
        assert.strictEqual(5, h3._lookup(0, 0, 'b'));
        assert.strictEqual(7, h3._lookup(0, 1, 'c'));
    });


    it('should set values correctly from list with no order', () => {
        const arr = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"];
    
        let h = hamt.empty;
        arr.forEach(function(x) {
            h = h.set(x, x);
        });
    
        arr.forEach(function(x) {
            assert.strictEqual(x, hamt.get(x, h));
        });
    });

    it('should set values correctly from an ordered list', () => {
        let h = hamt.empty;
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
            h = h.set(String.fromCharCode(i), i);
        }

        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
            assert.strictEqual(i, hamt.get(String.fromCharCode(i), h));
        }
    });
});

"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('set', () => {
    it('should add entry to empty map', () => {
        const h = hamt.set('a', 3, hamt.empty);
        assert.strictEqual(3, hamt.get('a', h));
    });
    
    it('should add entry to existing map', () => {
        const h = hamt.set('a', 3, hamt.empty);
        const h1 = hamt.set('b', 5, h);

        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        
        assert.strictEqual(3, hamt.get('a', h));
        assert.strictEqual(null, hamt.get('b', h));
    });
    
    it('should overwrite entry in existing map', () => {
        const h1 = hamt.set('c', 10, hamt.set('b', 5, hamt.set('a', 3, hamt.empty)));
        const h2 = hamt.set('b', 4, h1);

        assert.strictEqual(3, hamt.get('a', h2));
        assert.strictEqual(4, hamt.get('b', h2));
        assert.strictEqual(10, hamt.get('c', h2));

        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        assert.strictEqual(10, hamt.get('c', h1));
    });
    
    it('should handle collisions correctly', () => {
        const h1 = hamt.setHash(0, 'a', 3, hamt.empty);
        const h2 = hamt.setHash(0, 'b', 5, h1);
    
        assert.strictEqual(3, hamt.getHash(0, 'a', h2));
        assert.strictEqual(5, hamt.getHash(0, 'b', h2));
    });
        
    
    it('should add to collisions correctly', () => {
        const h1 = hamt.setHash(0, 'a', 3, hamt.empty);
        const h2 = hamt.setHash(0, 'b', 5, h1);
        const h3 = hamt.setHash(1, 'c', 7, h2);

        assert.strictEqual(3, hamt.getHash(0, 'a', h3));
        assert.strictEqual(5, hamt.getHash(0, 'b', h3));
        assert.strictEqual(7, hamt.getHash(1, 'c', h3));
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
            h = hamt.set(x, x, h);
        });
    
        arr.forEach(function(x) {
            assert.strictEqual(x, hamt.get(x, h));
        });
    });

    it('should set values correctly from an ordered list', () => {
        let h = hamt.empty;
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
            h = hamt.set(String.fromCharCode(i), i, h);
        }

        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); ++i) {
            assert.strictEqual(i, hamt.get(String.fromCharCode(i), h));
        }
    });
});

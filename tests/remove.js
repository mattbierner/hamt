"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('chai').assert;

describe('remove', () => {
    it('should noop on empty', () => {
        assert.strictEqual(0, hamt.count(hamt.remove('a', hamt.empty)));
        assert.strictEqual(0, hamt.count(hamt.remove('b', hamt.empty)));
    });
    
    it('should remove value from single map', () => {
        const h1 = hamt.set('a', 3, hamt.empty);
        const h2 = hamt.remove('a', h1);
        
        assert.strictEqual(0, hamt.count(h2));
        assert.strictEqual(null, hamt.get('a', h2));
        
        assert.strictEqual(1, hamt.count(h1));
        assert.strictEqual(3, hamt.get('a', h1));
    });
    
    it('should only remove a single entry', () => {
        const h1 = hamt.set('b', 5, hamt.set('a', 3, hamt.empty));
        const h2 = hamt.remove('a', h1);
        
        assert.strictEqual(1, hamt.count(h2));
        assert.strictEqual(null, hamt.get('a', h2));
        assert.strictEqual(5, hamt.get('b', h2));

        assert.strictEqual(2, hamt.count(h1));
        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
    });
    
    it('should remove collisions correctly a single entry', () => {
        const h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
        const h2 = hamt.removeHash(0, 'a', h1);
        
        assert.strictEqual(1, hamt.count(h2));
        assert.strictEqual(null, hamt.getHash(0, 'a', h2));
        assert.strictEqual(5, hamt.getHash(0, 'b', h2));

        assert.strictEqual(2, hamt.count(h1));
        assert.strictEqual(3, hamt.getHash(0, 'a', h1));
        assert.strictEqual(5, hamt.getHash(0, 'b', h1));
    });
    
     it('should not remove for a collision that does not match key', () => {
        const h1 = hamt.setHash(0, 'b', 5, hamt.setHash(0, 'a', 3, hamt.empty));
        const h2 = hamt.removeHash(0, 'c', h1);
    
        assert.strictEqual(hamt.getHash(0, 'a', h2), 3);
        assert.strictEqual(hamt.getHash(0, 'b', h2), 5);
        assert.strictEqual(hamt.getHash(0, 'c', h2), null);
    });
    
    it('should remove correctly from large set', () => {
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
        insert.forEach(function(x) {
            h = hamt.set(x, x, h);
        });
    
        for (let i = 0; i < remove.length; ++i) {
            h = hamt.remove(remove[i], h);
        
            for (let g = 0; g <= i; ++g) {
                assert.strictEqual(
                    hamt.get(remove[g], h),
                    null);
            }
            for (let g = i + 1; g < remove.length; ++g) {
                assert.strictEqual(
                    hamt.get(remove[g], h),
                    remove[g]);
            }
        }
    });
});

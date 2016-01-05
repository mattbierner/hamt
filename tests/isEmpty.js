"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('isEmpty', () => {
    it('should return true for empty', () => {
        assert.isTrue(hamt.isEmpty(hamt.empty));
        assert.isTrue(hamt.empty.isEmpty());
    });
    
    it('should false for single element map', () => {
        assert.isFalse(hamt.isEmpty(hamt.empty.set('a', 4)));
        assert.isFalse(hamt.empty.set('a', 4).isEmpty());
    });
    
    it('should return false for collision', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);
            
        assert.isFalse(hamt.isEmpty(h1));
        assert.isFalse(h1.isEmpty());
    });
    
    it('should handle remove correctly', () => {
        var h1 = hamt.empty
            .set('a', 3)
            .set('b', 5);
        
        var h2 = h1.delete('a');
        var h3 = h2.delete('b');
        
        assert.isFalse(hamt.isEmpty(h1));
        assert.isFalse(hamt.isEmpty(h2));
        assert.isTrue(hamt.isEmpty(h3));
    });
    
     it('should handle remove collision correctly', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);
            
        var h2 = h1.deleteHash(0, 'a');
        var h3 = h2.deleteHash(0, 'b');
        
        assert.isFalse(hamt.isEmpty(h1));
        assert.isFalse(hamt.isEmpty(h2));
        assert.isTrue(hamt.isEmpty(h3));
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
                h = h.set(x, x);
                assert.isFalse(hamt.isEmpty(h));
            }
    
            for (let i = 0; i < remove.length; ++i) {
                assert.isFalse(hamt.isEmpty(h));
                h = h.remove(remove[i]);
            }
            
            assert.isTrue(hamt.isEmpty(h));
    });
});


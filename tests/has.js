"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('has', () => {
    it('should return false for empty map', () => {
        assert.strictEqual(false, hamt.has('a', hamt.empty));
        assert.strictEqual(false, hamt.has('b', hamt.empty));
    });
    
    it('should return if entry exists for single map', () => {
        var h1 = hamt.empty.set('a', 3);
    
        assert.strictEqual(true, h1.has('a'));
        assert.strictEqual(false, h1.has('b'));
    });
    
     it('should not depend on stored value', () => {    
        assert.strictEqual(true, hamt.has('a', hamt.empty.set('a', 3)));
        assert.strictEqual(true, hamt.has('a', hamt.empty.set('a', false)));
        assert.strictEqual(true, hamt.has('a', hamt.empty.set('a', null)));
        assert.strictEqual(true, hamt.has('a', hamt.empty.set('a', undefined)));
    });
    
    it('should return if entry exists in map', () => {
        var h = hamt.empty;
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); i += 2) {
            h = h.set(String.fromCharCode(i), i);
        }
    
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0);) {
            assert.strictEqual(true, hamt.has(String.fromCharCode(i++), h));
            assert.strictEqual(false, hamt.has(String.fromCharCode(i++), h));
        }
    });
});

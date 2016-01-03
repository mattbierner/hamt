"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('has', () => {
    it('should return false for empty map', () => {
        assert.strictEqual(false, hamt.has('a', hamt.empty));
        assert.strictEqual(false, hamt.has('b', hamt.empty));
    });
    
    it('should return if entry exists for single map', () => {
        var h1 = hamt.set('a', 3, hamt.empty);
    
        assert.strictEqual(true, hamt.has('a', h1));
        assert.strictEqual(false, hamt.has('b', h1));
    });
    
     it('should not depend on stored value', () => {    
        assert.strictEqual(true, hamt.has('a', hamt.set('a', false, hamt.empty)));
        assert.strictEqual(true, hamt.has('a', hamt.set('a', true, hamt.empty)));
        assert.strictEqual(true, hamt.has('a', hamt.set('a', null, hamt.empty)));
        assert.strictEqual(true, hamt.has('a', hamt.set('a', undefined, hamt.empty)));
    });
    
    it('should return if entry exists in map', () => {
        var h = hamt.empty;
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0); i += 2) {
            h = hamt.set(String.fromCharCode(i), i, h);
        }
    
        for (let i = 'A'.charCodeAt(0); i < 'z'.charCodeAt(0);) {
            assert.strictEqual(true, hamt.has(String.fromCharCode(i++), h));
            assert.strictEqual(false, hamt.has(String.fromCharCode(i++), h));
        }
    });
});

"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('chai').assert;

describe('tryGet', () => {
    it('should return default for empty map', () => {
        assert.strictEqual(10, hamt.tryGet(10, 'a', hamt.empty));
        assert.strictEqual(10, hamt.tryGet(10, 'b', hamt.empty));
        assert.strictEqual(false, hamt.tryGet(false, 'a', hamt.empty));
        
        const a = {};
        assert.strictEqual(a, hamt.tryGet(a, 'b', hamt.empty));
    });
    
    it('should return default for non-existant value', () => {
        var h1 = hamt.set('a', 3, hamt.empty);
    
        assert.strictEqual(3, hamt.tryGet(10, 'a', h1));
        assert.strictEqual(10, hamt.tryGet(10, 'b', h1));
    });
});

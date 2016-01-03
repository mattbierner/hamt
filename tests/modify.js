"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('chai').assert;

describe('modify', () => {
    it('should update entry in single map', () => {
        const h = hamt.set('a', 3, hamt.empty);
        const h1 = hamt.modify('a', x => x * 2, h);

        assert.strictEqual(hamt.get('a', h1), 6);
    });

    it('should insert into empty map', () => {
        const h = hamt.modify('a', function(x) { return 10; }, hamt.empty);
        assert.strictEqual(hamt.get('a', h), 10);
    });

    it('should modify collision values correctly', () => {
        const h1 = hamt.setHash(0, 'a', 3, hamt.empty);
        const h2 = hamt.setHash(0, 'b', 5, h1);
    
        const h3 = hamt.modifyHash(0, 'a', function(x) { return x * 2; }, h2);
        assert.strictEqual(hamt.getHash(0, 'a', h3), 6);
        assert.strictEqual(hamt.getHash(0, 'b', h3), 5);
    
        const h4 = hamt.modifyHash(0, 'b', function(x) { return x * 2; }, h3);
        assert.strictEqual(hamt.getHash(0, 'a', h4), 6);
        assert.strictEqual(hamt.getHash(0, 'b', h4), 10);
    
        // Non existant
        const h5 = hamt.modifyHash(0, 'c', function(x) { return 100; }, h4);
        assert.strictEqual(hamt.getHash(0, 'a', h5), 6);
        assert.strictEqual(hamt.getHash(0, 'b', h5), 10);
        assert.strictEqual(hamt.getHash(0, 'c', h5), 100);
    });
});

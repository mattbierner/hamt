"use strict";
const hamt = require('../dist_node/hamt');
const assert = require('chai').assert;

describe('modify', () => {
    it('should update entry in single map', () => {
        const h = hamt.set('a', 3, hamt.empty);
        const h1 = hamt.modify('a', x => x * 2, h);

        assert.strictEqual(6, hamt.get('a', h1));
        assert.strictEqual(3, hamt.get('a', h));
    });

    it('should insert into empty map', () => {
        const h = hamt.modify('a', _ => 10, hamt.empty);
        assert.strictEqual(10, hamt.get('a', h));
    });
    
    
    it('should call `f` with zero args on insert', () => {
        const h = hamt.modify('a', function(x) {
            assert.strictEqual(0, arguments.length);
            assert.strictEqual(undefined, x);
        }, hamt.empty);
    });
    
    it('should insert if no value in map matches', () => {
        const h = hamt.set('a', 3, hamt.set('b', 5, hamt.empty));
        const h1 = hamt.modify('c',  _ => 10, h);
        
        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        assert.strictEqual(10, hamt.get('c', h1));

        assert.strictEqual(3, hamt.get('a', h));
        assert.strictEqual(5, hamt.get('b', h));
        assert.strictEqual(null, hamt.get('c', h));
    });

    it('should modify collision values correctly', () => {
        const h1 = hamt.setHash(0, 'a', 3, hamt.empty);
        const h2 = hamt.setHash(0, 'b', 5, h1);
    
        const h3 = hamt.modifyHash(0, 'a', x => x * 2, h2);
        assert.strictEqual(6, hamt.getHash(0, 'a', h3));
        assert.strictEqual(5, hamt.getHash(0, 'b', h3));
    
        const h4 = hamt.modifyHash(0, 'b', x => x * 2, h3);
        assert.strictEqual(6, hamt.getHash(0, 'a', h4));
        assert.strictEqual(10, hamt.getHash(0, 'b', h4));
    
        // Non existant
        const h5 = hamt.modifyHash(0, 'c', _ => 100, h4);
        assert.strictEqual(6, hamt.getHash(0, 'a', h5));
        assert.strictEqual(10, hamt.getHash(0, 'b', h5));
        assert.strictEqual(100, hamt.getHash(0, 'c', h5));
    });
});

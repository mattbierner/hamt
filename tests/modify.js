"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('modify', () => {
    it('should update entry in single map', () => {
        const h = hamt.set(3, 'a', hamt.empty);
        const h1 = hamt.modify(x => x * 2, 'a', h);

        assert.strictEqual(6, hamt.get('a', h1));
        assert.strictEqual(3, hamt.get('a', h));
    });

    it('should work on with method calls', () => {
        const h = hamt.empty.set('a', 3);
        const h1 = h.modify('a', x => x * 2);

        assert.strictEqual(6, h1.get('a'));
        assert.strictEqual(3, h.get('a'));
    });


    it('should insert into empty map', () => {
        const h = hamt.empty.modify('a', _ => 10);
        assert.strictEqual(10, hamt.get('a', h));
    });
    
    
    it('should call `f` with zero args on insert', () => {
        const h = hamt.modify(function(x) {
            assert.strictEqual(0, arguments.length);
            assert.strictEqual(undefined, x);
        }, 'a',  hamt.empty);
    });
    
    it('should insert if no value in map matches', () => {
        const h = hamt.empty.set('a', 3).set('b', 5);
        const h1 = hamt.modify(_ => 10, 'c', h);
        
        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
        assert.strictEqual(10, hamt.get('c', h1));

        assert.strictEqual(3, hamt.get('a', h));
        assert.strictEqual(5, hamt.get('b', h));
        assert.strictEqual(undefined, hamt.get('c', h));
    });

    it('should modify collision values correctly', () => {
        const h1 = hamt.empty
            ._modify(0, () => 3, 0, 'a')
            ._modify(0, () => 5, 0, 'b');
    
        const h3 = h1._modify(0, x => x * 2, 0, 'a');
        assert.strictEqual(6, h3._lookup(0, 0, 'a'));
        assert.strictEqual(5, h3._lookup(0, 0, 'b'));
    
        const h4 = h3._modify(0, x => x * 2, 0, 'b');
        assert.strictEqual(6, h4._lookup(0, 0, 'a'));
        assert.strictEqual(10, h4._lookup(0, 0, 'b'));
    
        // Non existant
        const h5 = h4._modify(0, _ => 100, 0, 'c');
        assert.strictEqual(6, h5._lookup(0, 0, 'a'));
        assert.strictEqual(10, h5._lookup(0, 0, 'b'));
        assert.strictEqual(100, h5._lookup(0, 0, 'c'));
    });
});

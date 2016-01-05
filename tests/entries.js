"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('entries', () => {
    it('should be empty for empty map', () => {
        const h = hamt.empty;
        const it = hamt.entries(h);
        
        let v = it.next();
        assert.ok(v.done);
        
        for (let x of h)
            assert.isFalse(true);
    });
    
    it('should visit single child', () => {
        const it = hamt.entries(hamt.empty.set('a', 3));
        let v = it.next();
        
        assert.deepEqual(['a', 3], v.value);
        assert.notOk(v.done);
        v = it.next();
        assert.ok(v.done);
    });
    
    it('should visit all children', () => {
        const h = hamt.empty
            .set('a', 3)
            .set('b', 5)
            .set('c', 7);
        
        const expected = [['a', 3], ['b', 5], ['c', 7]];
        
        {
            const it = h.entries();
            const results = [];
            let v; 
            for (var i = 0; i < h.count(); ++i) {
                v = it.next();
                assert.notOk(v.done);
                results.push(v.value)
            }
            v = it.next();
            assert.isTrue(v.done);
            assert.deepEqual(expected, results);
        }
        assert.deepEqual(expected, Array.from(h));
    });
    
    it('should handle collisions', () => {
        const h = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5)
            .setHash(0, 'c', 7)
            
        const expected = [['b', 5], ['a', 3], ['c', 7]];
                    
       {
            const it = h.entries();
            const results = [];
            let v; 
            for (var i = 0; i < h.count(); ++i) {
                v = it.next();
                assert.notOk(v.done);
                results.push(v.value)
            }
            v = it.next();
            assert.isTrue(v.done);
            assert.deepEqual(expected, results);
        }
        assert.deepEqual(expected, Array.from(h));
    });

    it('should handle large map correctly', () => {
        let h = hamt.empty;
        
        let sum = 0;
        for (let i = 0; i < 20000; ++i) {
            h = h.set(i + '', i);
            sum += i;
        }
        
        let foundSum = 0;
        for (let x of h)
            foundSum += x[1];
        assert.strictEqual(sum, foundSum);
    });
});


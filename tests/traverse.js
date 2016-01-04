"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('travers', () => {
     it('should allow capturing cont', () => {
        let h = hamt.empty.set('a', 1).set('b', 5);
        
        let sum = 0;
        let k;
        hamt.traverse((v, key, _k) => {
            sum += v;
            if (!k)
                k = _k
        }, h);
        
        assert.strictEqual(1, sum);
        k();
        assert.strictEqual(6, sum);
        k();
        assert.strictEqual(11, sum);
    });

    it('should handle large map correctly', () => {
        let h = hamt.empty;
        
        let sum = 0;
        for (let i = 0; i < 20000; ++i) {
            h = h.set(i + '', i);
            sum += i;
        }
        
        let foundSum = 0;
        hamt.traverse((v, key, k) => {
            foundSum += v;
            return k();
        }, h);
        assert.strictEqual(sum, foundSum);
    });
});


"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('fold', () => {
    it('should return default value for empty map', () => {
        let h = hamt.empty;
        assert.strictEqual(5, h.fold(() => assert.ok(false), 5));

        const val = {};
        assert.strictEqual(val, h.fold(() => assert.ok(false), val));
    });

    it('should handle large folds correctly', () => {
        let h = hamt.empty;
        
        let sum = 0;
        for (let i = 0; i < 20000; ++i) {
            h = h.set(i + '', i);
            sum += i;
        }
        
        assert.strictEqual(sum, h.fold((p, c) => p + c, 0));
    });
});


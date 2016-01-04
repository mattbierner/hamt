"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('fold', () => {
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


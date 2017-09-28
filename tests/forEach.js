"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('forEach', () => {
    it('should noop for empty map', () => {
        hamt.forEach(() => {
            assert.ok(false);
        }, hamt.empty);
    });


    it('should be invoked for every element in map', () => {
        let h = hamt.empty.set('a', 3).set('b', 5);

        let foundSum = 0;
        h.forEach(x => {
            foundSum += x;
        });

        assert.strictEqual(8, foundSum);
    });

    it('should handle large map correctly', () => {
        let h = hamt.empty;

        let sum = 0;
        for (let i = 0; i < 20000; ++i) {
            h = h.set(i + '', i);
            sum += i;
        }

        let foundSum = 0;
        h.forEach(x => {
            foundSum += x;
        });

        assert.strictEqual(sum, foundSum);
    });
});


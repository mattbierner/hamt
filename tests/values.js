"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('values', () => {
    it('should return empty for empty map', () => {
        assert.deepEqual([], Array.from(hamt.values(hamt.empty)));
    });

    it('should return single key for single element map', () => {
        assert.deepEqual([3], Array.from(hamt.values(hamt.empty.set('a', 3))));
        assert.deepEqual([5], Array.from(hamt.empty.set('b', 5).values()));
    });

    it('should return all values for collision', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);

        assert.sameMembers([5, 3], Array.from(h1.values()));
    });

    it('should return duplicate values', () => {
        const h = hamt.empty.set('b', 3).set('a', 3);
        assert.deepEqual([3, 3], Array.from(hamt.values(h)));
    });

    it('return correct values while items are added', () => {
        const insert = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"
        ];

        let h = hamt.empty;
        insert.forEach(x => {
            h = h.set(x, x);
        });

        assert.sameMembers(insert, Array.from(hamt.values(h)));
    });
});

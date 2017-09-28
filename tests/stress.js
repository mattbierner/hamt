"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

/**
 * Generate an array of `count` random strings between length (wl / 2, `wl`].
 */
const generateWords = function(count, wl) {
    var out = [];
    for (var i = 0; i < count; ++i) {
        var len = Math.ceil(wl / 2 + Math.random() * wl / 2);
        var w = '';
        while (len--)
            w += String.fromCharCode(97 + Math.floor(Math.random() * 26))
        out.push(w);
    }
    return out;
};


function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

describe('stress', () => {
    it('should correctly handle a large number of random inserts and deletes', () => {
        const wordCount = 10000
        const words = generateWords(wordCount, 10)

        let h = hamt.empty;
        for (let i = 0; i < wordCount; ++i) {
            h = h.set(words[i], i);
            assert.strictEqual(h.size, i + 1);
        }

        shuffle(words);

        for (let i = 0; i < wordCount; ++i) {
            assert.isTrue(h.has(words[i]));
            h = h.remove(words[i], i);
            assert.isFalse(h.has(words[i]));
            assert.strictEqual(h.size, wordCount - i - 1);
        }
    });
});
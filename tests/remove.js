"use strict";
const hamt = require('../hamt');
const assert = require('chai').assert;

describe('remove', () => {
    it('should noop on empty', () => {
        assert.strictEqual(0, hamt.count(hamt.remove('a', hamt.empty)));
        assert.strictEqual(0, hamt.count(hamt.remove('b', hamt.empty)));
    });

    it('should remove value from single map', () => {
        const h1 = hamt.empty.set('a', 3);
        const h2 = h1.remove('a');

        assert.strictEqual(0, hamt.count(h2));
        assert.strictEqual(undefined, hamt.get('a', h2));

        assert.strictEqual(1, hamt.count(h1));
        assert.strictEqual(3, hamt.get('a', h1));
    });

    it('should allow removing non existant values', () => {
        const h1 = hamt.empty.set('a', 3);
        const h2 = h1.remove('z').remove('y');

        assert.strictEqual(h1, h2);
    });

    it('should only remove a single entry', () => {
        const h1 = hamt.empty
            .set('a', 3)
            .set('b', 5);
        const h2 = hamt.remove('a', h1);

        assert.strictEqual(1, hamt.count(h2));
        assert.strictEqual(undefined, hamt.get('a', h2));
        assert.strictEqual(5, hamt.get('b', h2));

        assert.strictEqual(2, hamt.count(h1));
        assert.strictEqual(3, hamt.get('a', h1));
        assert.strictEqual(5, hamt.get('b', h1));
    });

    it('should remove collisions correctly a single entry', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);

        const h2 = h1.deleteHash(0, 'a');

        assert.strictEqual(1, hamt.count(h2));
        assert.strictEqual(undefined, h2.getHash(0, 'a'));
        assert.strictEqual(5, h2.getHash(0, 'b'));

        assert.strictEqual(2, hamt.count(h1));
        assert.strictEqual(3, h1.getHash(0, 'a'));
        assert.strictEqual(5, h1.getHash(0, 'b'));
    });

    it('should not remove for a collision that does not match key', () => {
        const h1 = hamt.empty
            .setHash(0, 'a', 3)
            .setHash(0, 'b', 5);

        const h2 = h1.removeHash(0, 'c');

        assert.strictEqual(3, h2.getHash(0, 'a'));
        assert.strictEqual(5, h2.getHash(0, 'b'));
        assert.strictEqual(undefined, h2.getHash(0, 'c'));
        assert.strictEqual(h1, h2);
    });

    it('should remove correctly from large set', () => {
        const insert = [
            "n", "U", "p", "^", "h", "w", "W", "x", "S", "f", "H", "m", "g",
            "l", "b", "_", "V", "Z", "G", "o", "F", "Q", "a", "k", "j", "r",
            "B", "A", "y", "\\", "R", "D", "i", "c", "]", "C", "[", "e", "s",
            "t", "J", "E", "q", "v", "M", "T", "N", "L", "K", "Y", "d", "P",
            "u", "I", "O", "`", "X"
        ];

        const remove = [
            "w", "m", "Q", "R", "i", "K", "P", "Y", "D", "g", "y", "L",
            "b", "[", "a", "t", "j", "W", "J", "G", "q", "r", "p", "U",
            "v", "h", "S", "_", "d", "x", "I", "F", "f", "n", "B", "\\",
            "k", "V", "N", "l", "X", "A", "]", "s", "Z", "O", "^", "o",
            "`", "H", "E", "e", "M", "u", "T", "c", "C"
        ];

        let h = hamt.empty;
        insert.forEach(function(x, i) {
            h = hamt.set(x, x, h);
            assert.strictEqual(i + 1, h.size);
        });

        for (let i = 0; i < remove.length; ++i) {
            h = hamt.remove(remove[i], h);
            assert.strictEqual(remove.length - i - 1, h.size);

            for (let g = 0; g <= i; ++g)
                assert.strictEqual(undefined, hamt.get(remove[g], h));

            for (let g = i + 1; g < remove.length; ++g)
                assert.strictEqual(remove[g], hamt.get(remove[g], h));
        }
    });

    it('should not mutate for noop remove', () => {
        const h1 = hamt.empty
            .set('a', 3)
            .set('b', 5);
        const h2 = hamt.remove('none', h1);

        assert.strictEqual(h1, h2);
    });

    it('should work when all values are removed', () => {
        const keys = ['hiymmhdhq', 'hzyghyg', 'hzieut', 'mjnaup', 'tinjxpys', 'kwpcqm',
            'vxeusxcg', 'faybuua', 'lycfxflwft', 'tnwtzj', 'lrvycc', 'flaqdhqkj',
            'ngkmhejrm', 'jkqotnew', 'tvnxhguhn', 'frisdgmgwk', 'xqhakqug', 'cncoahk',
            'zczoqcfqy', 'czlfnbl', 'comrfarx', 'xkxedunf', 'szzmuwuuu', 'mcqhmf',
            'zqyjwwjba', 'kqoxvzky', 'mihnuv', 'shydgsfmpp', 'rdokftl', 'hzkpejjor',
            'uuwfazpud', 'wauyyr', 'nhfzckr', 'kmfdpcdgwi', 'twhbuhpgp', 'eyzbrtjwa',
            'aqdohkac', 'mteeptl', 'lmyxutoqg', 'ijqumqzsq', 'qwpqnsp', 'yklnknl',
            'byjxqzl', 'ryptefqr', 'fhplnoi', 'uvflmypxsa', 'xsenqm', 'kpquygdx',
            'ztsfcuy', 'xjrtyl', 'elzgmbcsfs', 'tksobwth', 'nxfktmbn', 'qsiqzdl',
            'ztfxghd', 'blekwtpzg', 'ogtwty', 'jvwzhjwmnl', 'xiqset', 'yaeazzw',
            'megtbspnvy', 'afjowwuv', 'ysaldydgvx', 'vrejaghyy', 'ogwjrroeiu', 'alvdrg',
            'lytqpgdnt', 'yaiedb', 'czrtsqh', 'bfvxsoxvql', 'vpfaam', 'kbiyel', 'vwwubrdqx',
            'iwhibpcqm', 'jrhkkzw', 'ajezbycwg', 'asubyu', 'ctdjnchw', 'gbzbbmdug', 'njxcfr',
            'mddyfqb', 'xgtthksh', 'cocjuvwrjm', 'xnwuoczjnh', 'nqehrflx', 'szyfto',
            'vpmynbgdo', 'zourijqabw', 'olujjqqkxy', 'rifpiaoqrj', 'ahurel', 'rqfdytylz',
            'ymgpnp', 'qevprue', 'sjttddstx', 'uqjuyyu', 'mkwxsgg', 'aesdxulaw', 'nwtfbe',
            'duyksei'];
        const order = [62, 6, 52, 79, 89, 1, 94, 16, 10, 21, 70, 99, 7, 81, 63,
            73, 53, 50, 25, 26, 78, 29, 28, 13, 35, 77, 84, 51, 15, 36, 96, 92, 69,
            18, 88, 12, 20, 58, 14, 48, 17, 4, 82, 76, 42, 5, 9, 86, 87, 43, 61, 2,
            66, 41, 68, 56, 54, 74, 22, 34, 3, 57, 31, 72, 91, 95, 23, 90, 32, 71,
            85, 80, 60, 11, 0, 55, 46, 40, 37, 67, 75, 64, 97, 27, 49, 93, 47, 38,
            83, 59, 65, 30, 98, 8, 44, 24, 19, 39, 45, 33];

        let h = hamt.empty;
        keys.forEach(function(x) {
            h = hamt.set(x, x, h);
        });

        order.forEach(function(x, i) {
            h = hamt.remove(keys[x], h);
        });
    });
});

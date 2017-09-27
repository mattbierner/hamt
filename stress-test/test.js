var hamt = require('../hamt.js');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var map = hamt.empty;

var prev;
var filePath = path.join(__dirname, 'data.txt');
fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data) {
    var lines = data.split('\n');
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];
        var kv = line.split(' ');
        var key = kv[0];
        var value = kv[1];
        prev = map;
        map = map.set(key, value);

        var fetched_value = hamt.get(key, map);
        hamt.get(key + key, map);

        if (fetched_value !== value) {
            hamt.set(key, value, prev);
            console.log('failed to get immediately inserted key value pair');
            console.log('key: ' + key);
            console.log('fetched value: ' + fetched_value);
            console.log('expected value: ' + value);
            assert(false);
        }
    }
});

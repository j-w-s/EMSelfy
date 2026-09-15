var fs = require('fs');

var _headerCache = {};

var readHeader = function (fd) {
    var prefix = Buffer.alloc(8);
    fs.readSync(fd, prefix, 0, 8, 0);

    var outerPickleSize = prefix.readUInt32LE(4);

    var inner = Buffer.alloc(outerPickleSize);
    fs.readSync(fd, inner, 0, outerPickleSize, 8);

    var jsonLen = inner.readUInt32LE(4);
    var json = inner.slice(8, 8 + jsonLen).toString('utf8');

    return {
        header: JSON.parse(json),
        dataOffset: 8 + outerPickleSize,
    };
};

var getCachedHeader = function (asarPath) {
    if (_headerCache[asarPath]) {
        return _headerCache[asarPath];
    }
    var fd = fs.openSync(asarPath, 'r');
    try {
        var parsed = readHeader(fd);
        _headerCache[asarPath] = parsed;
        return parsed;
    } finally {
        fs.closeSync(fd);
    }
};

var findEntry = function (header, relativePath) {
    var parts = relativePath.split(/[\/\\]/).filter(function (p) {
        return p.length > 0;
    });
    var node = header;

    for (var i = 0; i < parts.length; i++) {
        if (!node || !node.files || !node.files[parts[i]]) {
            return null;
        }
        node = node.files[parts[i]];
    }

    return node;
};

exports.exists = function (asarPath, relativePath) {
    try {
        var parsed = getCachedHeader(asarPath);
        var entry = findEntry(parsed.header, relativePath);
        return !!(entry && entry.size !== undefined);
    } catch (e) {
        return false;
    }
};

exports.readFileSync = function (asarPath, relativePath) {
    var parsed = getCachedHeader(asarPath);
    var entry = findEntry(parsed.header, relativePath);

    if (!entry || entry.size === undefined) {
        throw new Error('asar: file not found: ' + relativePath);
    }

    var fd = fs.openSync(asarPath, 'r');
    try {
        var offset = parsed.dataOffset + parseInt(entry.offset, 10);
        var buffer = Buffer.alloc(entry.size);
        if (entry.size > 0) {
            fs.readSync(fd, buffer, 0, entry.size, offset);
        }
        return buffer;
    } finally {
        fs.closeSync(fd);
    }
};

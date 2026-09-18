const fs = require('fs');

const headerCache = new Map();

function readHeader(fd) {
    const prefix = Buffer.alloc(8);
    fs.readSync(fd, prefix, 0, 8, 0);

    const outerPickleSize = prefix.readUInt32LE(4);

    const inner = Buffer.alloc(outerPickleSize);
    fs.readSync(fd, inner, 0, outerPickleSize, 8);

    const jsonLen = inner.readUInt32LE(4);
    const json = inner.slice(8, 8 + jsonLen).toString('utf8');

    return {
        header: JSON.parse(json),
        dataOffset: 8 + outerPickleSize,
    };
}

function getCachedHeader(asarPath) {
    if (headerCache.has(asarPath)) return headerCache.get(asarPath);

    const fd = fs.openSync(asarPath, 'r');
    try {
        const parsed = readHeader(fd);
        headerCache.set(asarPath, parsed);
        return parsed;
    } finally {
        fs.closeSync(fd);
    }
}

function findEntry(header, relativePath) {
    const parts = relativePath.split(/[\/\\]/).filter((p) => p.length > 0);
    let node = header;

    for (const part of parts) {
        if (!node?.files?.[part]) return null;
        node = node.files[part];
    }

    return node;
}

exports.exists = function (asarPath, relativePath) {
    try {
        const { header } = getCachedHeader(asarPath);
        const entry = findEntry(header, relativePath);
        return !!(entry && entry.size !== undefined);
    } catch (e) {
        return false;
    }
};

exports.readFileSync = function (asarPath, relativePath) {
    const parsed = getCachedHeader(asarPath);
    const entry = findEntry(parsed.header, relativePath);

    if (!entry || entry.size === undefined) {
        throw new Error('asar: file not found: ' + relativePath);
    }

    const fd = fs.openSync(asarPath, 'r');
    try {
        const offset = parsed.dataOffset + Number.parseInt(entry.offset, 10);
        const buffer = Buffer.alloc(entry.size);
        if (entry.size > 0) {
            fs.readSync(fd, buffer, 0, entry.size, offset);
        }
        return buffer;
    } finally {
        fs.closeSync(fd);
    }
};

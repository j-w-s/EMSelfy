const lib = {
    fs: require('fs'),
    path: require('path'),
    xml2js: require('xml2js').parseString,
};

let sqlXmlCache;

exports.read = function (path) {
    return lib.fs.readFileSync(path, 'utf8');
};

exports.getConfig = function () {
    return JSON.parse(exports.read(lib.path.join(__dirname, '../config/config.json')));
};

exports.getSql = function (id) {
    if (!sqlXmlCache) {
        lib.xml2js(exports.read(lib.path.join(__dirname, '../basic/sql.xml')), (err, xml) => {
            sqlXmlCache = xml;
        });
    }
    return sqlXmlCache.querys.query.find((item) => item.$.id == id) || {};
};

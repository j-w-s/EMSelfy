var lib = {
    fs: require('fs'),
    path : require("path"),
    xml2js: require("xml2js").parseString,
}



//@name format
//@parans time "Date Object"
//@parans format "yyyy-MM-dd"
exports.read = function (path) {
    var data = lib.fs.readFileSync(path, "utf8");
    return data;
};

exports.getConfig = function () {
    return JSON.parse(exports.read(lib.path.join(__dirname, "../config/config.json")));
}

exports.getSql = function (id, callback) {
    var sql = lib.xml2js(exports.read(lib.path.join(__dirname, "../basic/sql.xml")), function (err, xml) {
        var query = {};
        
        for (var i in xml.querys.query) {
            var item = xml.querys.query[i];
            if (item.$.id == id) { query = item; }
        };
        
        callback(query);
    });
}
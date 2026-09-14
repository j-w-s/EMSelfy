var str = require("../utils/stringUtils.js");
var lib = {
    fs : require("fs")
    ,url : require("url")
    ,path : require("path")
    ,qs : require("querystring")
    ,sqlite: require("sqlite3").verbose()
    ,xml: require("xml")
    ,config: require("../utils/configUtils.js")
    ,template: require("ejs")
    ,htmldecode: require("js-htmlencode").htmlDecode
    ,guid: () => require('crypto').randomUUID()
};

var config = lib.config.getConfig();

var _db = new lib.sqlite.Database(lib.path.join(__dirname, "../", config["database"]));
var db = {
    db: _db
    ,user: require("../database/user.js").create(_db)
    ,selfy: require("../database/selfy.js").create(_db)
};

var $u = require("../utils/utils.js");

var prot = 0;
exports.init = function (p) {
    prot = p;
    db.user.serialize();
    db.selfy.serialize();
    console.log(str.format("server listen prot:{0}", prot));
}

exports.server = function (request, response) {
    if (request.connection.remoteAddress != "127.0.0.1") {
        response.writeHead(302, { 'Location': "http://blog.emcodes.club" });
        response.end();
        return;
    }
    var _dir = lib.path.parse(__dirname).dir;
    
    var url = lib.url.parse(request.url);
    var query = lib.qs.parse(url.query);
    
    if (url.pathname.toLocaleLowerCase() == "/getinfo") {
        getInfo(url, query, request, response);
        return;
    }
    
    if (url.pathname.toLocaleLowerCase() == "/getclothesinfo.do") {
        getClothesInfo(url, query, request, response);
        return;
    }
    
    if (str.startsWith(url.pathname.toLocaleLowerCase(), "/clothes/") || str.startsWith(url.pathname.toLocaleLowerCase(), "/imgs/")) {
        getClothes(url, query, request, response);
        return;
    }
    
    if (url.pathname.toLocaleLowerCase() == "/getlist") {
        getList(url, query, request, response);
        return;
    }
    
    if (url.pathname.toLocaleLowerCase() == "/favorites") {
        favorites(url, query, request, response);
        return;
    }
    
    if (url.pathname.toLocaleLowerCase() == "/history") {
        history(url, query, request, response);
        return;
    }
    
    var p = lib.path.join(_dir , "assets" , url.pathname.replace(/\.\//g, ""));
    
    if (!lib.fs.existsSync(p)) {
        response.writeHead(401);
        response.write("string:完全不知道你在说啥...?");
        response.end();
        return;
    }
    lib.fs.readFile(p, undefined, function (err, b) {
        response.writeHead(200, {
            "content-type": getContentType(url.pathname)
        });
        response.write(b);
        response.end();
    });
    return;
    
}

var ContentType = JSON.parse(lib.fs.readFileSync(lib.path.join(__dirname, "../basic/contentType.json"), "utf8").toString());
var getContentType = function (name) {
    var e = lib.path.parse(name);
    return ContentType[e.ext] || ContentType["."];
}

var getInfo = function (url, query, request, response) {
    
    //准备sql语句
    var source_sql = "SELECT [Name] 'value' FROM [EMSelfy_Source]";
    var style_sql = "select style 'style' from ( " +
                    "select style, count(1) c " +
                    "from EMSelfy_Clothes " +
                    "group by style " +
                    ") " +
                    "order by c desc";
    
    var db = new lib.sqlite.Database(lib.path.join(__dirname, "../", config["database"]));
    
    db.serialize(function () {
        db.all(source_sql, function (err, rows) {
            var sources = $u.array.select(rows, function (v) { return v["value"]; });
            db.all(style_sql, function (err, rows) {
                var styles = $u.array.select(rows, function (v) { return v["style"]; });
                
                //处理并返回xml数据
                var data = JSON.stringify({ sources: sources, styles: styles });
                
                response.writeHead(200, {
                    "content-type": "text/json",
                    //"content-length": data.length,
                });
                
                response.write(data);
                response.end();
            });
        });
    });
}

var getClothesInfo = function (url, query, request, response) {
    
    db.selfy.getClohesInfo(query, function (err, rows) {
        var data = $u.array.select(rows, function (row) {
            return { accessory: { _attr: { category: row.Category, id: row.ClothesId, part: row.Part } } };
        });
        
        var xml_txt = lib.xml(data);
        response.writeHead(200, {
            "content-type": getContentType("0.xml")
            ,"content-length": xml_txt.length
            ,'x-power-by': "blog.emcodes.club charitable project"
        });
        
        response.write(xml_txt);
        response.end();
    });
}

var getClothes = function (url, query, request, response) {
    
    var p = lib.path.join(__dirname , "../", config["selfy-file"], url.pathname);
    
    if (!lib.fs.existsSync(p)) { response.writeHead(404); response.end(); return; }
    
    var buffers = lib.fs.readFileSync(p);
    response.writeHead(200, { "content-type": getContentType(p), "content-length": buffers.length, });
    response.write(buffers);
    response.end();
}

var getList = function (url, query, request, response) {
    
    var keys = query.key && query.key.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
    var params = $u.seach.toObj(keys);
    
    params["_"] && (params["key"] = params["_"]);
    
    params.pn = parseInt(query.pn);
    params.type = query.type;

    var resp = function (code, obj) {
        response.writeHead(code, {
            "content-type": "application/json",
            'x-power-by': "blog.emcodes.club charitable project"
        });
        
        response.write(JSON.stringify(obj));
        response.end();
    }
    
    db.selfy.getList(params, function (err, data) {
        if (err) { resp(500, { code: -1, msg: "操作数据库时发生错误!", value: data }); return; }
        resp(200, { code: 1, msg: "Success!", value: data });
    });
}

var favorites = function (url, query, request, response) {
    var resp = function (code, obj) {
        response.writeHead(code, {
            "content-type": "application/json",
            'x-power-by': "blog.emcodes.club charitable project"
        });
        
        response.write(JSON.stringify(obj));
        response.end();
    }
    
    switch (query.action) {
        case "add":
            db.user.addFavorites(query.id, function (err) {
                if (err) { resp(500, { code: -1, msg: "操作数据库时出现错误!" }); return; }
                resp(200, { code: 1, msg: "Success!" });
            });
            break;

        case "del":
            db.user.delFavorites(query.id, function (err) {
                if (err) { resp(500, { code: -1, msg: "操作数据库时出现错误!" }); return; }
                resp(200, { code: 1, msg: "Success!" });
            });
            break;
    }
}

var history = function (url, query, request, response) {
    var resp = function (code, obj) {
        response.writeHead(code, {
            "content-type": "application/json",
            'x-power-by': "blog.emcodes.club charitable project"
        });
        
        response.write(JSON.stringify(obj));
        response.end();
    }
    
    switch (query.action) {
        case "add":
            db.user.addHistory(query.ids, function (err) {
                if (err) { resp(500, { code: -1, msg: "操作数据库时出现错误!" }); return; }
                resp(200, { code: 1, msg: "Success!" });
            });
            
            break;
        case "del":
            db.user.delHistory(query.id, function (err) {
                if (err) { resp(500, { code: -1, msg: "操作数据库时出现错误!" }); return; }
                resp(200, { code: 1, msg: "Success!" });
            });
            break;
        case "clear":
            db.user.clearHistory(query.id, function (err) {
                if (err) { resp(500, { code: -1, msg: "操作数据库时出现错误!" }); return; }
                resp(200, { code: 1, msg: "Success!" });
            });
            break;
    }
}

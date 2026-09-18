const str = require('../utils/stringUtils.js');
const lib = {
    fs: require('fs'),
    path: require('path'),
    qs: require('querystring'),
    sqlite: require('bun:sqlite'),
    xml: require('xml'),
    config: require('../utils/configUtils.js'),
    template: require('ejs'),
    asar: require('../utils/asarUtils.js'),
    htmldecode: require('js-htmlencode').htmlDecode,
    guid: () => require('crypto').randomUUID(),
};

const config = lib.config.getConfig();

const _db = new lib.sqlite.Database(lib.path.join(__dirname, '../', config['database']));
const db = {
    db: _db,
    user: require('../database/user.js').create(_db),
    selfy: require('../database/selfy.js').create(_db),
};

const $u = require('../utils/utils.js');

const ContentType = JSON.parse(
    lib.fs.readFileSync(lib.path.join(__dirname, '../basic/contentType.json'), 'utf8'),
);

function getContentType(name) {
    const e = lib.path.parse(name);
    return ContentType[e.ext] || ContentType['.'];
}

function jsonResponder(response) {
    return (code, obj) => {
        response.writeHead(code, {
            'content-type': 'application/json',
            'x-power-by': 'blog.emcodes.club charitable project',
        });
        response.write(JSON.stringify(obj));
        response.end();
    };
}

let prot = 0;

exports.init = function (p) {
    prot = p;
    db.user.serialize();
    db.selfy.serialize();
    setImmediate(() => {
        try {
            lib.asar.exists(lib.path.join(__dirname, '../', config['selfy-file']), '/imgs');
        } catch (e) {}
    });
    console.log(str.format('server listen prot:{0}', prot));
};

exports.server = function (request, response) {
    const remoteAddress = request.connection.remoteAddress;
    if (
        remoteAddress != '127.0.0.1' &&
        remoteAddress != '::1' &&
        remoteAddress != '::ffff:127.0.0.1'
    ) {
        response.writeHead(302, { Location: 'http://blog.emcodes.club' });
        response.end();
        return;
    }

    const _dir = lib.path.parse(__dirname).dir;
    const parsed = new URL(request.url, 'http://localhost');
    const url = { pathname: parsed.pathname };
    const query = lib.qs.parse(parsed.searchParams.toString());
    const pathname = url.pathname.toLocaleLowerCase();

    if (pathname == '/getinfo') return getInfo(url, query, request, response);
    if (pathname == '/getclothesinfo.do') return getClothesInfo(url, query, request, response);
    if (str.startsWith(pathname, '/clothes/') || str.startsWith(pathname, '/imgs/')) {
        return getClothes(url, query, request, response);
    }
    if (pathname == '/getlist') return getList(url, query, request, response);
    if (pathname == '/favorites') return favorites(url, query, request, response);
    if (pathname == '/history') return history(url, query, request, response);

    const p = lib.path.join(_dir, 'assets', url.pathname.replace(/\.\//g, ''));

    if (!lib.fs.existsSync(p)) {
        response.writeHead(401);
        response.write('string:完全不知道你在说啥...?');
        response.end();
        return;
    }
    lib.fs.readFile(p, undefined, (err, b) => {
        response.writeHead(200, {
            'content-type': getContentType(url.pathname),
        });
        response.write(b);
        response.end();
    });
};

function getInfo(url, query, request, response) {
    //准备sql语句
    const source_sql = "SELECT [Name] 'value' FROM [EMSelfy_Source]";
    const style_sql =
        "select style 'style' from ( " +
        'select style, count(1) c ' +
        'from EMSelfy_Clothes ' +
        'group by style ' +
        ') ' +
        'order by c desc';

    const infoDb = new lib.sqlite.Database(lib.path.join(__dirname, '../', config['database']));
    try {
        const sources = $u.array.select(infoDb.query(source_sql).all(), (v) => v['value']);
        const styles = $u.array.select(infoDb.query(style_sql).all(), (v) => v['style']);

        //处理并返回xml数据
        const data = JSON.stringify({ sources, styles });

        response.writeHead(200, {
            'content-type': 'text/json',
        });
        response.write(data);
        response.end();
    } catch (e) {
        response.writeHead(500);
        response.write('DB error: ' + e.message);
        response.end();
    } finally {
        infoDb.close();
    }
}

function getClothesInfo(url, query, request, response) {
    const rows = db.selfy.getClohesInfo(query);
    const data = $u.array.select(rows, (row) => ({
        accessory: { _attr: { category: row.Category, id: row.ClothesId, part: row.Part } },
    }));

    const xml_txt = lib.xml(data);
    response.writeHead(200, {
        'content-type': getContentType('0.xml'),
        'content-length': xml_txt.length,
        'x-power-by': 'blog.emcodes.club charitable project',
    });
    response.write(xml_txt);
    response.end();
}

function getClothes(url, query, request, response) {
    const archivePath = lib.path.join(__dirname, '../', config['selfy-file']);
    const _dir = lib.path.parse(__dirname).dir;

    // Try asar first (clothing sprites), then fall back to plain files in assets/
    if (lib.asar.exists(archivePath, url.pathname)) {
        const asarBuf = lib.asar.readFileSync(archivePath, url.pathname);
        response.writeHead(200, {
            'content-type': getContentType(url.pathname),
            'content-length': asarBuf.length,
        });
        response.write(asarBuf);
        response.end();
        return;
    }

    const fsPath = lib.path.join(_dir, 'assets', url.pathname);
    if (lib.fs.existsSync(fsPath)) {
        lib.fs.readFile(fsPath, undefined, (err, b) => {
            if (err) {
                response.writeHead(500);
                response.end();
                return;
            }
            response.writeHead(200, {
                'content-type': getContentType(url.pathname),
                'content-length': b.length,
            });
            response.write(b);
            response.end();
        });
        return;
    }

    response.writeHead(404);
    response.end();
}

function getList(url, query, request, response) {
    const keys = query.key && query.key.replace(/\+/g, ' ').replace(/\s+/g, ' ').trim();
    const params = $u.seach.toObj(keys);

    params['_'] && (params['key'] = params['_']);
    params.pn = Number.parseInt(query.pn);
    params.type = query.type;

    const resp = jsonResponder(response);

    try {
        const data = db.selfy.getList(params);
        resp(200, { code: 1, msg: 'Success!', value: data });
    } catch (e) {
        resp(500, { code: -1, msg: '操作数据库时发生错误!', value: {} });
    }
}

// Runs a synchronous db action and writes the standard success/error JSON shape.
function respondToAction(resp, action) {
    try {
        action();
        resp(200, { code: 1, msg: 'Success!' });
    } catch (e) {
        resp(500, { code: -1, msg: '操作数据库时出现错误!' });
    }
}

function favorites(url, query, request, response) {
    const resp = jsonResponder(response);

    switch (query.action) {
        case 'add':
            respondToAction(resp, () => db.user.addFavorites(query.id));
            break;
        case 'del':
            respondToAction(resp, () => db.user.delFavorites(query.id));
            break;
    }
}

function history(url, query, request, response) {
    const resp = jsonResponder(response);

    switch (query.action) {
        case 'add':
            respondToAction(resp, () => db.user.addHistory(query.ids));
            break;
        case 'del':
            respondToAction(resp, () => db.user.delHistory(query.id));
            break;
        case 'clear':
            respondToAction(resp, () => db.user.clearHistory(query.id));
            break;
    }
}

/*
 * database/selfy.js
 * 对操作Selfy数据/文件相关封装
 * 保险岛 last change 2016-01-08 21:08
 */

const lib = {
    sqlite: require('bun:sqlite'),
    fs: require('fs'),
    path: require('path'),
    str: require('../utils/stringUtils.js'),
    $u: require('../utils/utils.js'),
    config: require('../utils/configUtils.js'),
};

const config = lib.config.getConfig();

const CLOTHES_CATEGORIES = [
    'face',
    'hat',
    'hair',
    'accef',
    'top',
    'coat',
    'back',
    'bottom',
    'accen',
    'bg',
    'shoe',
    'fg',
    'ffg',
    'acceh',
    'motion',
];

function Selfy(a) {
    this._db = typeof a == 'string' ? new lib.sqlite.Database(a) : a;
}

Selfy.prototype = {
    // No-op: bun:sqlite opens synchronously, kept only so existing call
    // sites (create(str, true)) don't need to change.
    serialize() {},
    close() {
        this._db.close();
    },
    getClohesInfo(query) {
        const selfyIds = lib.$u.array.distinct(
            lib.$u.array
                .select(CLOTHES_CATEGORIES, (name) => Number.parseInt(query[name]))
                .filter((id) => !Number.isNaN(id)),
        );

        if (selfyIds.length === 0) return [];

        const sql = lib.str.format(
            'SELECT [Id],[ClothesId],[Category],[Part],[Sort],[CreateTime] FROM [Selfy_Part] where [ClothesId] in ({0})',
            lib.$u.array.join(selfyIds, ',', "'", "'"),
        );
        return this._db.query(sql).all();
    },
    getList(query) {
        const {
            sql: sql1,
            params: params1,
            config: queryConfig,
        } = lib.$u.sql.loadSql('queryList', query);
        const { sql: sql2, params: params2 } = lib.$u.sql.loadSql('queryList.count', query);

        const rows = this._db.query(sql1).all(params1);
        const [count] = this._db.query(sql2).all(params2);

        const favoritesSql = lib.str.format(
            "select [ClothesId] from [EmSelfy_userFavorites] where [ClothesId] in('{0}')",
            lib.$u.array.select(rows, (row) => row.Id).join("','"),
        );
        const favoriteRows = this._db.query(favoritesSql).all();

        for (const row of rows) {
            row.favorites = favoriteRows.filter((fav) => fav.ClothesId == row.Id).length;
        }

        return { count: count.c, pagesize: queryConfig.pageSize, data: rows };
    },
    getFile(url) {
        const filePath = lib.path.join(__dirname, '../', config['selfy-file'], url);
        if (!lib.fs.existsSync(filePath)) throw new Error('FILE NOT FOUND');
        return lib.fs.readFileSync(filePath);
    },
};

exports.create = function (str) {
    return new Selfy(str);
};

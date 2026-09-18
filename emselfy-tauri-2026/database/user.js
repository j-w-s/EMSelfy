/*
 * database/user.js
 * 对用户操作数据库相关封装
 * 保险岛 last change 2016-01-08 21:08
 */

const lib = {
    sqlite: require('bun:sqlite'),
    guid: () => require('crypto').randomUUID(),
    str: require('../utils/stringUtils.js'),
    $u: require('../utils/utils.js'),
};

function Selfy(a) {
    this._db = typeof a == 'string' ? new lib.sqlite.Database(a) : a;
}

Selfy.prototype = {
    serialize() {
        this._initDB();
    },
    close() {
        this._db.close();
    },
    //
    //begin private
    _initDB() {
        this._db.exec(`CREATE TABLE IF NOT EXISTS [EMSelfy_userFavorites] (
    [Id] nvarchar(40) COLLATE NOCASE NOT NULL PRIMARY KEY,
    [ClothesId] integer,
    [CreateTime] datetime
);
CREATE TABLE IF NOT EXISTS [EmSelfy_userHistory] (
    [Id] nvarchar(40) COLLATE NOCASE NOT NULL PRIMARY KEY,
    [ClothesId] integer,
    [CreateTime] datetime
);`);
    },
    //end private
    //

    //
    //begin favorites
    addFavorites(ids) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        this.delFavorites(ids);

        const values = lib.$u.array
            .select(ids, (item) =>
                lib.str.format(
                    "('{0}','{1}','{2}')",
                    lib.guid(),
                    item,
                    lib.str.timeFormat(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                ),
            )
            .join(',');

        this._db.exec(
            'insert into EMSelfy_userFavorites(Id,ClothesId,CreateTime) values ' + values,
        );
    },
    delFavorites(ids) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        const sql = lib.str.format(
            'delete from EMSelfy_userFavorites where [ClothesId] in ({0})',
            lib.$u.array.join(ids, ',', "'", "'"),
        );

        this._db.exec(sql);
    },
    //end favorites
    //

    //
    //begin history
    addHistory(ids) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        const values = lib.$u.array
            .select(ids, (item) =>
                lib.str.format(
                    "('{0}','{1}','{2}')",
                    lib.guid(),
                    item,
                    lib.str.timeFormat(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                ),
            )
            .join(',');

        this._db.exec('insert into EMSelfy_userHistory(Id,ClothesId,CreateTime) values ' + values);
    },
    //注意:这里第一个参数试试传入id字段而不是clothesid!!
    delHistory(hids) {
        const ids = hids instanceof Array ? hids : [hids];
        if (ids.length == 0) return;

        const sql = lib.str.format(
            'delete from EMSelfy_userHistory where [id] in ({0})',
            lib.$u.array.join(ids, ',', "'", "'"),
        );

        this._db.exec(sql);
    },
    clearHistory() {
        this._db.exec('delete from EMSelfy_userHistory');
    },
    //end history
    //
};

exports.create = function (str) {
    return new Selfy(str);
};

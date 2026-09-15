/*
 * database/user.js
 * 对用户操作数据库相关封装
 * 保险岛 last change 2016-01-08 21:08
 */

var lib = {
    sqlite: require('bun:sqlite'),
    fs: require('fs'),
    guid: () => require('crypto').randomUUID(),
    str: require('../utils/stringUtils.js'),
    $u: require('../utils/utils.js'),
    $func: require('../utils/func.js'),
};

var _obj = function (a) {
    this._db = typeof a == 'string' ? new lib.sqlite.Database(a) : a;
    var self = this;
    this._db.exec = function (sql, cb) {
        try {
            self._db.query(sql).run();
            if (cb) cb(null);
        } catch (e) {
            if (cb) cb(e);
        }
    };
    this._db.serialize = function (fn) {
        if (fn) fn();
    };
};

_obj.prototype = {
    serialize: function (callback) {
        var $this = this;
        $this._db.serialize(function () {
            $this._initDB(lib.$func.proxy(callback, $this));
        });
    },
    close: function () {
        this._db.close();
    },
    //
    //begin private
    _initDB: function (callback) {
        var sql =
            'CREATE TABLE IF NOT EXISTS [EMSelfy_userFavorites] (         \n' +
            '   [Id] nvarchar(40) COLLATE NOCASE NOT NULL PRIMARY KEY,  \n' +
            '   [ClothesId] integer,                                    \n' +
            '   [CreateTime] datetime                                   \n' +
            ');                                                         \n' +
            'CREATE TABLE IF NOT EXISTS [EmSelfy_userHistory] (         \n' +
            '   [Id] nvarchar(40) COLLATE NOCASE NOT NULL PRIMARY KEY,  \n' +
            '   [ClothesId] integer,                                    \n' +
            '   [CreateTime] datetime                                   \n' +
            ');';

        this._db.exec(sql, lib.$func.proxy(callback, this));
    },
    //end private
    //

    //
    //begin favorites
    addFavorites: function (ids, callback) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        this.delFavorites(ids, function () {
            var sql = 'insert into EMSelfy_userFavorites(Id,ClothesId,CreateTime) values ';

            sql += lib.$u.array
                .select(ids, function (item) {
                    return lib.str.format(
                        "('{0}','{1}','{2}')",
                        lib.guid(),
                        item,
                        lib.str.timeFormat(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                    );
                })
                .join(',');

            this._db.exec(sql, lib.$func.proxy(callback, this));
        });
    },
    delFavorites: function (ids, callback) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        var sql = 'delete from EMSelfy_userFavorites where [ClothesId] in ({0})';

        sql = lib.str.format(sql, lib.$u.array.join(ids, ',', "'", "'"));

        this._db.exec(sql, lib.$func.proxy(callback, this));
    },
    //end favorites
    //

    //
    //begin history
    addHistory: function (ids, callback) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        var sql = 'insert into EMSelfy_userHistory(Id,ClothesId,CreateTime) values ';

        sql += lib.$u.array
            .select(ids, function (item) {
                return lib.str.format(
                    "('{0}','{1}','{2}')",
                    lib.guid(),
                    item,
                    lib.str.timeFormat(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                );
            })
            .join(',');

        this._db.exec(sql, lib.$func.proxy(callback, this));
    },
    //注意:这里第一个参数试试传入id字段而不是clothesid!!
    delHistory: function (hids, callback) {
        ids = ids instanceof Array ? ids : [ids];
        if (ids.length == 0) return;

        var sql = 'delete from EMSelfy_userHistory where [id] in ({0})';

        sql = lib.str.format(sql, lib.$u.array.join(ids, ',', "'", "'"));

        this._db.exec(sql, lib.$func.proxy(callback, this));
    },
    clearHistory: function (callback) {
        this._db.exec('delete from EMSelfy_userHistory', lib.$func.proxy(callback, this));
    },
    //end history
    //
};

exports.create = function (str, auto) {
    var o = new _obj(str);
    auto == true && o.serialize();
    return o;
};

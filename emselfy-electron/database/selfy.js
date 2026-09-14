/*
 * database/selfy.js
 * 对操作Selfy数据/文件相关封装
 * 保险岛 last change 2016-01-08 21:08
 */

var lib = {
    sqlite: require('sqlite3').verbose(),
    fs: require('fs'),
    path: require('path'),
    guid: () => require('crypto').randomUUID(),
    str: require('../utils/stringUtils.js'),
    $u: require('../utils/utils.js'),
    $func: require('../utils/func.js'),
    config: require('../utils/configUtils.js'),
};

var config = lib.config.getConfig();

var _obj = function (a) {
    this._db = typeof a == 'string' ? new lib.sqlite.Database(a) : a;
};

_obj.prototype = {
    serialize: function (callback) {
        lib.$func.apply(callback, $this);
    },
    close: function () {
        $this._db.close();
    },
    getClohesInfo: function (query, callback) {
        var selfy_ids = [];

        lib.$u.each(
            [
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
            ],
            function (name) {
                var value = parseInt(query[name]);
                if (isNaN(value)) return;

                selfy_ids.push(value);
            },
        );

        selfy_ids = lib.$u.array.distinct(selfy_ids); //id去重
        if (selfy_ids.length == 0) {
            lib.$func.apply(callback, this, undefined, []);
            return;
        }

        var sql =
            'SELECT [Id],[ClothesId],[Category],[Part],[Sort],[CreateTime] FROM [Selfy_Part] where [ClothesId] in ({0})';
        sql = lib.str.format(sql, lib.$u.array.join(selfy_ids, ',', "'", "'"));
        this._db.all(sql, {}, lib.$func.proxy(callback, this));
    },
    getList: function (query, callback) {
        var $this = this;

        var query_db = function (sql1, sql_params1, sql2, sql_params2, config) {
            $this._db.all(sql1, sql_params1, function (err, rows) {
                if (err) {
                    lib.$func.apply(callback, $this, [err, {}]);
                    return;
                }
                $this._db.all(sql2, sql_params2, function (err, count) {
                    if (err) {
                        lib.$func.apply(callback, $this, [err, {}]);
                        return;
                    }

                    var sql =
                        "select [ClothesId] from [EmSelfy_userFavorites] where [ClothesId] in('{0}')";
                    sql = lib.str.format(
                        sql,
                        lib.$u.array
                            .select(rows, function (q) {
                                return q.Id;
                            })
                            .join("','"),
                    );
                    $this._db.all(sql, {}, function (err, farow) {
                        if (err) {
                            lib.$func.apply(callback, $this, [err, []]);
                            return;
                        }
                        rows = lib.$u.array.select(rows, function (item) {
                            item.favorites = lib.$u.array.where(farow, function (q) {
                                return q.ClothesId == item.Id;
                            }).length;
                            return item;
                        });

                        lib.$func.apply(callback, $this, [
                            err,
                            { count: count[0]['c'], pagesize: config.pageSize, data: rows },
                        ]);
                    });
                });
            });
        };
        lib.$u.sql.loadSql('queryList', query, function (sql1, sql_params1, config) {
            lib.$u.sql.loadSql('queryList.count', query, function (sql2, sql_params2) {
                query_db(sql1, sql_params1, sql2, sql_params2, config);
            });
        });
    },
    getFile: function (url, callback) {
        var path = lib.path.join(__dirname, '../', config['selfy-file'], url);

        if (!lib.fs.existsSync(path)) {
            lib.$func.apply(callback, ['FILE NOT FOUND']);
            return;
        }

        var buffers = lib.fs.readFileSync(p);
        lib.$func.apply(callback, [undefined, buffers]);
    },
};

exports.create = function (str, auto) {
    var o = new _obj(str);
    auto == true && o.serialize();
    return o;
};

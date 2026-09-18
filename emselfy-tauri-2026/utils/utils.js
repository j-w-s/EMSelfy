const lib = {
    config: require('../utils/configUtils.js'),
    template: require('ejs'),
    htmldecode: require('js-htmlencode').htmlDecode,
};

const $u = {};

$u.each = function (array, callback) {
    for (const [i, item] of array.entries()) {
        if (callback(item, i) === false) break;
    }
};

$u.seach = {
    toObj(str) {
        const obj = {};
        const regex = /([^:\s]+):(("([^"]+)")|([^\s]+))/g;
        let d = regex.exec(str);
        while (d) {
            obj[d[1]] = d[4] || d[5];
            d = regex.exec(str);
        }
        const key = str.replace(regex, '').trim();
        key && (obj['_'] = key);
        return obj;
    },
};

$u.array = {
    //判断一个元素是否在数组中
    //@return bool
    contains(array, test) {
        return typeof test === 'function' ? array.some(test) : array.includes(test);
    },
    //数组去除重复的元素并返回新的数组
    //@return array
    distinct(array) {
        return [...new Set(array)];
    },
    //连接数组,并且指定数组两遍插入的符号
    //@params array 数组
    //@params split 分隔符
    //@reutrn string
    join(array, split, left, right) {
        split = split || '';
        left = left || '';
        right = right || '';

        if (array.length == 0) return '';

        return left + array.join(left + split + right) + right;
    },
    //循环数组,并返回一个新对象
    //@reutrn array
    select(array, callback) {
        return array.map(callback);
    },
    //循环数组,并根据条件决定是否添加到新的返回数组
    //@reutrn array
    where(array, callback) {
        return array.filter(callback);
    },
};

$u.sql = {
    // Renders the named query template, then pulls out its $param / @param
    // placeholders into a bound-params object
    loadSql(sql, query) {
        const xml = lib.config.getSql(sql);
        const rendered = lib.htmldecode(lib.template.render(xml._, { query, config: xml.$ }));

        const params = {};
        for (const [placeholder, name] of rendered.matchAll(/\$(\w+)/g)) {
            params[placeholder] = query[name];
        }
        for (const [placeholder, name] of rendered.matchAll(/@(\w+)/g)) {
            params[placeholder] = '%' + query[name] + '%';
        }

        return { sql: rendered, params, config: xml.$ };
    },
};

module.exports = $u;

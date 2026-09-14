var lib = {
    config: require("../utils/configUtils.js"),
    template: require("ejs"),
    htmldecode: require("js-htmlencode").htmlDecode
}

var $u = {};

$u.each = function (array, callback) {
    for (var i in array) { if (callback(array[i], i) == false) { break; } };
}

$u.seach = {
    toObj: function (str) {
        var obj = {};
        var regex = /([^:\s]+):(("([^"]+)")|([^\s]+))/g;
        var d = regex.exec(str);
        while (d) {
            obj[d[1]] = d[4] || d[5];
            
            d = regex.exec(str)
        }
        var key = str.replace(regex, "").trim();
        key && (obj["_"] = key);
        return obj;
    }
}

$u.array = {
    //判断一个元素是否在数组中
    //@return bool
    contains: function (array, test) {
        var testfunc = function (item) { return item == test }
        if (typeof (test) == "function") { testfunc = test; }
        
        var exist = false;
        $u.each(array, function (item) {
            exist = testfunc(item) || false;
            if (exist) return false;
        });
        
        return exist;
    },
    //数组去除重复的元素并返回新的数组
    //@return array
    distinct: function (array) {
        var newarray = [];
        $u.each(array, function (item) {
            if ($u.array.contains(newarray, item)) { return; }
            newarray.push(item);
        });
        return newarray;
    },
    //连接数组,并且指定数组两遍插入的符号
    //@params array 数组
    //@params split 分隔符
    //@reutrn string
    join: function (array, split, left, right) {
        split = split || '';
        left = left || '';
        right = right || '';
        
        if (array.length == 0) return '';
        
        var str = array.join(left + split + right);
        return left + str + right;
         
    },
    //循环数组,并返回一个新对象
    //@reutrn array
    select: function (array, callback) {
        var newarray = [];
        $u.each(array, function (item) {
            newarray.push(callback(item));
        });
        return newarray;
    },
    //循环数组,并根据条件决定是否添加到新的返回数组
    //@reutrn array
    where: function (array, callback) {
        var newarray = [];
        $u.each(array, function (item) {
            callback(item) && newarray.push(item);
        });
        return newarray;
    }
}

$u.sql = {
    loadSql: function (sql, query, callback) {
        lib.config.getSql(sql, function (xml) {
            var sql = lib.htmldecode(lib.template.render(xml._, { query: query, config: xml.$ }));
            var regex_a = /\$(\w+)/g, regex_b = /\@(\w+)/g;
            
            var params = {};
            var p = regex_a.exec(sql);
            while (p != null) { params[p[0]] = query[p[1]]; p = regex_a.exec(sql); }
            p = regex_b.exec(sql);
            while (p != null) { params[p[0]] = '%' + query[p[1]] + '%'; p = regex_b.exec(sql); }
            
            callback(sql, params, xml.$);
        });
    }
 
}

module.exports = $u
;
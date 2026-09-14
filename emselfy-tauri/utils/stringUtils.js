
//time format
//@parans time "Date Object"
//string format
//@params str "aaa{0}ccc"
//@params arg1 
//@params arg2
//@params ...
exports.format = function (str, array) {
    var args = [];
    if (typeof (array) == "object") {
        args = array;
    } else {
        for (var i in arguments) {
            args.push(arguments[i]);
        };
        args.splice(0, 1);
    }
    
    var newstr = str.replace(/([^{]?){(\d+)}([^}]?)/g, function (v, left, num, right) {
        return left + args[parseInt(num)] + right;
    });
    return newstr;
}

//比较开头是否一致
exports.startsWith = function (text, test) {
    if (text.length < test.length) { return false; }
    return text.substring(0, test.length) == test;
}


//比较结尾是否一致
exports.endsWith = function (text, test) {
    if (text.length < test.length) { return false; }
    return text.substring(text.length - test.length) == test;
}

exports.isEmptyOrNull = function (str) {
    return str == undefined || str == null || str.trim() == "";
}

//@parans format "yyyy-MM-dd"
exports.timeFormat = function (time, format) {
    time = new Date(time);
    
    var z = {
        y: time.getFullYear(),
        M: time.getMonth() + 1,
        d: time.getDate(),
        H: time.getHours(),
        h: time.getHours(),
        m: time.getMinutes(),
        s: time.getSeconds()
    };
    
    return format.replace(/(y+|M+|d+|h+|H+|m+|s+)/g, function (v) {
        var str = "";
        str = z[v.substring(v.length - 1)].toString();
        while (str.length < v.length) { str = "0" + str; }
        return str;
    });
};
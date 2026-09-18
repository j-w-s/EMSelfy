//string format
//@params str "aaa{0}ccc"
//@params arg1
//@params arg2
//@params ...
exports.format = function (str, array, ...rest) {
    const args = typeof array === 'object' ? array : [array, ...rest];

    return str.replace(/([^{]?){(\d+)}([^}]?)/g, (_, left, num, right) => {
        return left + args[Number.parseInt(num)] + right;
    });
};

//比较开头是否一致
exports.startsWith = function (text, test) {
    if (text.length < test.length) return false;
    return text.substring(0, test.length) == test;
};

//比较结尾是否一致
exports.endsWith = function (text, test) {
    if (text.length < test.length) return false;
    return text.substring(text.length - test.length) == test;
};

exports.isEmptyOrNull = function (str) {
    return str == undefined || str == null || str.trim() == '';
};

//@parans format "yyyy-MM-dd"
exports.timeFormat = function (time, format) {
    time = new Date(time);

    const z = {
        y: time.getFullYear(),
        M: time.getMonth() + 1,
        d: time.getDate(),
        H: time.getHours(),
        h: time.getHours(),
        m: time.getMinutes(),
        s: time.getSeconds(),
    };

    return format.replace(/(y+|M+|d+|h+|H+|m+|s+)/g, (v) => {
        return z[v.substring(v.length - 1)].toString().padStart(v.length, '0');
    });
};

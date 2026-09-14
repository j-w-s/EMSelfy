var utils = {
    htmlencode: function (str) {
        var s = '';
        if (str.length == 0) return '';
        s = str.replace(/&/g, '&gt;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
        s = s.replace(/    /g, '&nbsp;');
        s = s.replace(/\'/g, "'");
        s = s.replace(/\"/g, '&quot;');
        s = s.replace(/\n/g, '<br>');
        return s;
    },
    htmldecode: function (str) {
        var s = '';
        if (str.length == 0) return '';
        s = str.replace(/&/g, '&');
        s = s.replace(/</g, '<');
        s = s.replace(/>/g, '>');
        s = s.replace(/ /g, ' ');
        s = s.replace(/'/g, "\'");
        s = s.replace(/"/g, '"');
        return s;
    },
    querystring: function (query) {
        if (typeof query == 'object') {
            return query;
        }

        var regex = /([^\?\&\#\=]*)\=([^\?\&\#\=]*)/g;

        var obj = {};
        do {
            var param = regex.exec(query);
            if (param != null) {
                obj[decodeURIComponent(param[1])] = decodeURIComponent(param[2]);
            }
        } while (param != null);

        return obj;
    },
    updatequery: function (query, obj) {
        query = utils.querystring(query);
        if (obj) {
            for (var item in obj) {
                query[item] = obj[item];
            }
        }

        var querystr = '';
        for (var item in query) {
            querystr += encodeURIComponent(item) + '=' + encodeURIComponent(query[item]) + '&';
        }
        if (querystr.length > 0) {
            querystr = querystr.substring(0, querystr.length - 1);
        }
        return querystr;
    },
    toSeachStr: function (obj) {
        var str = '';

        for (var key in obj) {
            if (key == '_') {
                continue;
            }
            var value = obj[key].trim();
            if (value == '') {
                continue;
            }
            str += key + ':';
            if (value.indexOf(' ') != -1) {
                str += '"' + value + '"';
            } else {
                str += value;
            }
            str += ' ';
        }

        if (obj['_']) {
            str += obj['_'];
        }

        return str;
    },
    toSeachObj: function (str) {
        var obj = {};
        var regex = /([^:\s]+):(("([^"]+)")|([^\s]+))/g;
        var d = regex.exec(str);
        while (d) {
            obj[d[1]] = d[4] || d[5];

            d = regex.exec(str);
        }
        var key = str.replace(regex, '').trim();
        key && (obj['_'] = key);
        return obj;
    },
    encodeRegEx: function (e) {
        return e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    },
    openURL: function (url) {
        return window.__TAURI__.core.invoke('open_url', { url: url });
    },
};

window.utils = utils;

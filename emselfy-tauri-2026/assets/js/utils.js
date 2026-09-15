const utils = {
    htmlencode(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/ {4}/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/\n/g, '<br>');
    },

    htmldecode(str) {
        if (!str) return '';
        return String(str)
            .replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, '    ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/<br\s*\/?>/gi, '\n');
    },

    querystring(query) {
        if (typeof query === 'object') return query;

        const regex = /([^?&#=]*)=([^?&#=]*)/g;
        const obj = {};
        let param;
        while ((param = regex.exec(query)) !== null) {
            obj[decodeURIComponent(param[1])] = decodeURIComponent(param[2]);
        }
        return obj;
    },

    updatequery(query, obj) {
        query = utils.querystring(query);
        if (obj) {
            for (const item in obj) query[item] = obj[item];
        }

        const parts = [];
        for (const item in query) {
            parts.push(`${encodeURIComponent(item)}=${encodeURIComponent(query[item])}`);
        }
        return parts.join('&');
    },

    toSeachStr(obj) {
        let str = '';
        for (const key in obj) {
            if (key === '_') continue;
            const value = String(obj[key]).trim();
            if (value === '') continue;
            str += `${key}:`;
            str += value.includes(' ') ? `"${value}"` : value;
            str += ' ';
        }
        if (obj['_']) str += obj['_'];
        return str;
    },

    toSeachObj(str) {
        const obj = {};
        const regex = /([^:\s]+):(("([^"]+)")|([^\s]+))/g;
        let d;
        while ((d = regex.exec(str)) !== null) {
            obj[d[1]] = d[4] || d[5];
        }
        const key = str.replace(regex, '').trim();
        if (key) obj['_'] = key;
        return obj;
    },

    encodeRegEx(e) {
        return e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    },

    openURL(url) {
        return window.__TAURI__.core.invoke('open_url', { url });
    },
};

window.utils = utils;

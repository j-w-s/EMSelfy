(function () {
    var DICT = window.EMSELFY_TRANSLATIONS || {};

    var sortedKeys = Object.keys(DICT).sort(function (a, b) {
        return b.length - a.length;
    });

    function translateString(str) {
        if (!str) return str;
        var result = str;
        for (var i = 0; i < sortedKeys.length; i++) {
            var key = sortedKeys[i];
            if (result.indexOf(key) !== -1) {
                result = result.split(key).join(DICT[key]);
            }
        }
        return result;
    }

    function containsCJK(str) {
        return /[\u4e00-\u9fff]/.test(str);
    }

    var SKIP_TAGS = {
        SCRIPT: true,
        STYLE: true,
        CANVAS: true,
        EMBED: true,
        OBJECT: true,
        IFRAME: true,
        VIDEO: true,
        AUDIO: true,
        SVG: true,
        'RUFFLE-PLAYER': true,
    };

    var ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'alt'];

    function translateElementAttributes(el) {
        for (var i = 0; i < ATTRS_TO_TRANSLATE.length; i++) {
            var attr = ATTRS_TO_TRANSLATE[i];
            var val = el.getAttribute && el.getAttribute(attr);
            if (val && containsCJK(val)) {
                el.setAttribute(attr, translateString(val));
            }
        }
    }

    function translateTextNode(node) {
        if (node.nodeValue && containsCJK(node.nodeValue)) {
            node.nodeValue = translateString(node.nodeValue);
        }
    }

    function walk(root) {
        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
            return;
        }
        if (root.nodeType === Node.ELEMENT_NODE) {
            if (SKIP_TAGS[root.tagName]) {
                return;
            }
            translateElementAttributes(root);
        }
        var child = root.firstChild;
        while (child) {
            walk(child);
            child = child.nextSibling;
        }
    }

    function runInitialPass() {
        walk(document.body);
    }

    function init() {
        runInitialPass();
        setInterval(runInitialPass, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

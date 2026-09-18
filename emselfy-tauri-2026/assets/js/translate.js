(() => {
    const DICT = window.EMSELFY_TRANSLATIONS || {};
    const sortedKeys = Object.keys(DICT).sort((a, b) => b.length - a.length);

    const CJK_PATTERN = /[\u4e00-\u9fff]/;
    const SKIP_TAGS = new Set([
        'SCRIPT',
        'STYLE',
        'CANVAS',
        'EMBED',
        'OBJECT',
        'IFRAME',
        'VIDEO',
        'AUDIO',
        'SVG',
        'RUFFLE-PLAYER',
    ]);
    const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'alt', 'aria-label'];

    function translateString(str) {
        if (!str) return str;
        let result = str;
        for (const key of sortedKeys) {
            if (result.includes(key)) {
                result = result.split(key).join(DICT[key]);
            }
        }
        return result;
    }

    function containsCJK(str) {
        return CJK_PATTERN.test(str);
    }

    function translateElementAttributes(el) {
        for (const attr of ATTRS_TO_TRANSLATE) {
            const val = el.getAttribute?.(attr);
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
            if (SKIP_TAGS.has(root.tagName)) return;
            translateElementAttributes(root);
        }
        for (let child = root.firstChild; child; child = child.nextSibling) {
            walk(child);
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

const $this = {
    apply(func, obj, args) {
        if (typeof func !== 'function') return;
        return func.apply(obj || this, args);
    },
    proxy(func, obj, args) {
        return (...callArgs) => $this.apply(func, obj || this, args || callArgs);
    },
};

module.exports = $this;

var $this = {
    apply: function (func, obj, args) {
        if (typeof func != 'function') {
            return;
        }
        obj = obj || this;
        return func.apply(obj, args);
    },
    proxy: function (func, obj, args) {
        return function () {
            var _args = args || arguments;
            obj = obj || this;

            return $this.apply(func, obj, _args);
        };
    },
};
module.exports = $this;

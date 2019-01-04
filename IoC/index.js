var App = /** @class */ (function () {
    function App(options) {
        this.options = options;
        this.init();
    }
    App.prototype.init = function () {
        var _this = this;
        window.addEventListener('DOMContentLoaded', function () {
            _this.initModules();
            _this.options.onReady(_this);
        });
    };
    App.use = function (module) {
        Array.isArray(module)
            ? module.forEach(function (item) { return App.use(item); })
            : App.modules.push(module);
    };
    App.prototype.initModules = function () {
        var _this = this;
        App.modules.forEach(function (module) {
            return module.init && typeof module.init === 'function' && module.init(_this);
        });
    };
    App.modules = [];
    return App;
}());

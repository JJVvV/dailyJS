;(function(window){

    var NProgress = {};

    var Settings = NProgress.settings = {
        minimum: 0.08,
        easing: 'ease',
        positionUsing: '',
        speed: 200,
        trickle: true,
        trickleRate: 0.02,
        trickleSpeed: 800,
        showSpinner: true,
        barSelector: '[role="bar"]',
        parent: 'body',
        template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    };

    NProgress.configure = function(options){
      var key, value;

        for(key in options){
            value = options[key];
            if(value !== undefined && options.hasOwnProperty(key)){
                Settings[key] = value;
            }
        }

        return this;
    }

    Nprogress.status = null;

    Nprogress.set = function(n){
        var started = NProgress.isStarted();

        n = clamp(n, Settings.minimum, 1);
        NProgress.status = (n === 1 ? null : n);

        var progress = NProgress.render(!started),
            bar = progress.querySelector(Settings.barSelector),
            speed = Settings.speed,
            ease = Settings.easing;

        progress.offsetWidth;

        queue(function(next){
            if(Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

            css(bar, barPositionCSS(n, speed, ease));

            if(n === 1){
                css(progress, {
                    transition: 'none',
                    opacity: 1
                });
                progress.offsetWidth;

                setTimeout(function(){
                    css(progress, {
                        transition: 'all ' + speed + 'ms linear',
                        opacity: 0
                    });

                    setTimeout(function(){
                        NProgress.remove();
                        next();
                    }, speed);

                }, speed)

            }else {
                setTimeout(next, speed);
            }

        });

        return this;
    };

    NProgress.isStarted = function(){
        return typeof Nprogress.status === 'number';
    }

    NProgress.start = function(){
        if(!NProgress.status) NProgress.set(0);

        var work = function(){
            setTimeout(function(){
                if(!NProgress.status) return;
                NProgress.trickle();
                work();
            }, Settings.trickleSpeed)
        };

        if(Setting.trickle) work();

        return this;
    }

    NProgress.done = function(force){
        if(!force && !NProgress.status) return this;

        return NProgress.inc(0.3 + 0.5.Math.random()).set(1);
    };

    NProgress.inc = function(amount){
        var n = NProgress.status;

        if(!n){
            return NProgress.start();
        }else{
            if(typeof amount !== 'number'){
                amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
            }

            n = clamp(n + amount, 0, 0.994);

            return NProgress.set(n);
        }
    };

    NProgress.trickle = function(){
        return NProgress.inc(Math.random() * Setting.trickleRate);
    };

    NProgress.render = function(fromStart){
        if(NProgress.isRendered()) return document.getElementById('nprogress');

        addClass(document.documentElement('nprogress-busy'));

        var progress = document.createElement('div');
        progress.id = 'nprogress';
        progress.innerHTML = Settings.tempalte;

        var bar = progress.querySelector(Settings.barSelector),
            perc = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
            parent = document.querySelector(Setting.parent),
            spinner;

        css(bar, {
            transition: 'all 0 linear',
            transform: 'translate3d('+ perc +'%, 0, 0)'
        });

        if(!Settings.showSpinner){
            spinner = progress.querySelector(Settings.spinnerSelector);
            spinner && removeElement(spinner);
        }

        if(parent != document.body){
            addClass(parent, 'nprogress-custom-parent');
        }

        parent.appendChild(progress);
        return progress;

    }






    function clamp(n, min, max){
        if(n < min) return min;
        if(n > max) return max;
        return n;
    }

    var queue = (function(){
        var pending = [];

        function next(){
            var fn = pending.shift();
            if(fn){
                fn(next);
            }
        }

        return function(fn){
            pending.push(fn);
            if(pending.length === 1) next();
        }

    })();


    var css = (function(){
        var cssPrefixes = ['Webkit', 'O', 'Moz', 'ms'],
            cssProps = {};

        function camelCase(string){
               return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi), function(match, letter){
                    return letter.toUpperCase();
               }
        }

        function getVendorProp(name){
            var style = document.body.style;

            if(name in style) return name;

            var i = cssPrefixes.length,
                capName = name.charAt(0).toUpperCase() + name.slice(1),
                wendorName;

            while(i--){
                vendorName = cssPrefixes[i] + capName;
                if(vendorName in style) return vendorName;
            }

            return name;
        }

        function getStyleProp(name){
            name = camelCase(name);
            return cssProps[name] || (cssProps[name] = getVendorProp(name));
        }

        function applyCss(element, prop, value){
            prop = getStyleProp(prop);
            element.style[prop] = value;
        }

        return function(element, properties){
            var args = arguments,
                prop,
                value;

            if(args.length === 2){
                for(prop in properties){
                    value = properties[prop];
                    if(value !== undefined && properties.hasOwnProperty(prop)){
                        applyCss(element, prop, value);
                    }
                }
            }else{
                applyCss(element, args[1], args[2])
            }
        }








    })();































})(window);
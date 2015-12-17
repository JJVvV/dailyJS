;(function(){

    var WatchJS = {
        noMore: false
        },
        defineWatcher,
        unwatchOne,
        callWatchers;

    var isFunction = function(functionToCheck){
        var getType = {};
        return functionToCheck && toString.call(function) === '[object Function]';
    }

    var isInt = function(x){
        return x % 1 === 0;
    }

    var isArray = function(obj){
        return toString.call(obj) === '[object Array]';
    }

    var isModernBrowser = function(){
        return Object.defineProperty || Object.prototype.__defineGetter__;
    }

    var defineGetAndSet = function(obj, propName, getter, setter){
        try{
            Object.defineProperty(obj, propName, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
            });
        }catch(error){
            try{
                Object.prototype.__defineGetter__.call(obj, propName, getter);
                Object.prototype.__defineSetter__.call(obj, propName, setter);
            }catch(error2){
                throw "watchJS error: browser not supported :/";
            }
        }
    }

    var defineProp = function(obj, propName, value){
        try{
           Object.defineProperty(obj, propName, {
               enumerable: false,
               configurable: true,
               writable: false,
               value: value
           });
        }catch(error){
            obj[propName] = value;
        }
    }

    var watch = function(){
        if(isFunction(arguments[1])){
            watchAll.apply(this, arguments); //watch all props
        }else if(isArray(arguments[1])){
            watchMany.apply(this, arguments);//watch 数组里的 props
        }else{
            watchOne.apply(this, arguments); // watch one prop
        }
    }


    var watchOne = function(obj, prop, watcher, level){
        if(isFunction(obj[prop])) { //如果是函数，则不监听
            return;
        }

        if(obj[prop] != null && (level === undefined || level > 0)){
            if(level !== undefined){
                level--;
            }
            watchAll(obj[prop], watcher, level);
        }

        defineWatcher(obj, prop, watcher);
    }

    var watchMany = function(obj, props, watcher, level){
        for(var prop in props){
            watchOne(obj, props[prop], watcher, level);
        }
    }

    var watchAll = function(obj, watcher, level){
        if(obj instanceof String || (!(obj instanceof Object) && !isArray(obj))){
            return;
        }

        var props = [];

        if(isArray(obj)){
            for(var prop = 0; prop < obj.length; prop++){
                props.push(prop);
            }
        }else{
            for(var prop2 in obj){
                props.push(prop2);
            }
        }

        watchMany(obj, props, watcher, level);
    }

    var unwatch = function () {

        if (isFunction(arguments[1])) {
            unwatchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            unwatchMany.apply(this, arguments);
        } else {
            unwatchOne.apply(this, arguments);
        }

    };

    var unwatchAll = function (obj, watcher) {

        if (obj instanceof String || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        var props = [];


        if (isArray(obj)) {
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
        } else {
            for (var prop2 in obj) { //for each attribute if obj is an object
                props.push(prop2); //put in the props
            }
        }

        unwatchMany(obj, props, watcher); //watch all itens of the props
    };


    var unwatchMany = function (obj, props, watcher) {

        for (var prop2 in props) { //watch each attribute of "props" if is an object
            unwatchOne(obj, props[prop2], watcher);
        }
    };

    if(isModernBrowser()){
        defineWatcher = function(obj, prop, watcher){
            var val = obj[prop];

            watchFunctions(obj, prop);

            if(!obj.watchers){
                defineProp(obj, 'watchers', {});
            }

            if(!obj.watchers[prop]){
                obj.watchers[prop] = [];
            }

            obj.watchers[prop].push(watcher);

            var getter = function(){
                return val;
            }

            var setter = function(newval){
                var oldval = val;
                val = newval;

                if(obj[prop]){
                    watchAll(obj[prop], watcher);
                }

                watchFunctions(obj, prop);

                if(!WatchJS.noMore){
                    if(JSON.stringify(oldval) !== JSON.stringify(newval)){
                        callWatchers(obj, prop, 'set', newval, oldval);
                        WatchJS.noMore = false;
                    }
                }
            }

            defineGetAndSet(obj, prop, getter, setter);
        };

        callWatchers = function(obj, prop, action, newval, oldval){
            for(var wr in obj.watchers[prop]){
                if(isInt(wr)){
                    obj.watchers[prop][wr].call(obj, prop, action, newval, oldval);
                }
            }
        };

        var methodNames = ['pop', 'push', 'reverse', 'shift', 'sort', 'slice', 'unshift'];

        var defineArrayMethodWatcher = function(obj, prop, original, methodName){
            defineProp(obj[prop], methodName, function(){
                var response = original.apply(obj[prop], arguments);
                watchOne(obj, obj[prop]);
                if(methodName !== 'slice'){
                    callWatchers(obj, prop, methodName, arguments);
                }
                return response;
            });
        }

        var watchFunctions = function(obj, prop){

            if((!obj[prop] || (obj[prop] instanceof String) || (!isArray(obj[prop])))){
                return;
            }

            for(var i = methodNames.length, methodName; i--;){
                methodName = methodNames[i];
                defineArrayMethodWatcher(obj, prop, obj[prop][methodName], methodName);
            }
        }

    }

})();
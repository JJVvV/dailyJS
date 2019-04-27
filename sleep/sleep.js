// console.clear();
// function taskDecorator(autoNext) {
//   return function(target, name, descriptor) {
//     if (descriptor) {
//       const oldValue = descriptor.value;
//       descriptor.value = function(...args) {
//         const that = this;
//         const newValue = function() {
//           const ret = oldValue.apply(
//             that,
//             args.concat(that.runNext.bind(that))
//           );
//           if (autoNext) {
//             that.runNext();
//           }
//           return ret;
//         };
//         this.addTask(newValue);
//         return this;
//       };
//       return descriptor;
//     }
//   };
// }
// class Human {
//   name: string;
//   tasks: any[];
//   constructor(name: string) {
//     this.name = name;
//     this.tasks = [];
//     this.say("I am " + this.name);
//     this.start();
//   }
//   start() {
//     const that = this;
//     setTimeout(() => {
//       that.runNext();
//     }, 0);
//   }
//   say(what) {
//     console.log(what);
//   }
//   addTask(fn) {
//     this.tasks.push(fn);
//   }
//   runNext() {
//     const task = this.tasks.shift();
//     task && task();
//   }
//   @taskDecorator(false)
//   sleep(time, next?) {
//     console.log("waiting: sleep for " + time);
//     setTimeout(() => {
//       next && next();
//     }, time * 1000);
//     return this;
//   }
//   @taskDecorator(true)
//   go(where) {
//     this.say("go: " + where);
//     return this;
//   }
//   @taskDecorator(true)
//   eat(what) {
//     this.say("Eat an " + what);
//     return this;
//   }
// }
// var aa = new Human("jack")
//   .sleep(3)
//   .go("home")
//   .eat("apple")
//   .sleep(2)
//   .eat("apple too");
var Human = /** @class */ (function () {
    function Human(name) {
        this.name = name;
        this.tasks = [];
        this.say("I am " + this.name);
        this.start();
    }
    Human.prototype.start = function () {
        var that = this;
        setTimeout(function () {
            that.runNext();
        }, 0);
    };
    Human.prototype.say = function (what) {
        console.log(what);
    };
    Human.prototype.addTask = function (fn) {
        this.tasks.push(fn);
    };
    Human.prototype.runNext = function () {
        var task = this.tasks.shift();
        task && task();
    };
    Human.prototype.sleep = function (time) {
        var that = this;
        var anon = function () {
            console.log("waiting: sleep for " + time);
            setTimeout(function () {
                that.runNext();
            }, time * 1000);
        };
        this.addTask(anon);
        return this;
    };
    Human.prototype.go = function (where) {
        var that = this;
        var anon = function () {
            that.say("go " + where);
            that.runNext();
        };
        this.addTask(anon);
        return this;
    };
    Human.prototype.eat = function (what) {
        var that = this;
        var anon = function () {
            that.say("Eat an " + what);
            that.runNext();
        };
        this.addTask(anon);
        return this;
    };
    return Human;
}());
var aa = new Human("小明")
    .sleep(3)
    .go("home")
    .eat("apple")
    .sleep(2)
    .eat("apple too");

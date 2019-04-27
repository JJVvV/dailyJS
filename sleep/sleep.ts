console.clear();

function taskDecorator(autoNext) {
  return function(target, name, descriptor) {
    if (descriptor) {
      const oldValue = descriptor.value;

      descriptor.value = function(...args) {
        const that = this;
        const newValue = function() {
          const ret = oldValue.apply(
            that,
            args.concat(that.runNext.bind(that))
          );
          if (autoNext) {
            that.runNext();
          }

          return ret;
        };

        this.addTask(newValue);
        return this;
      };
      return descriptor;
    }
  };
}

class Human {
  name: string;
  tasks: any[];
  constructor(name: string) {
    this.name = name;
    this.tasks = [];
    this.say("I am " + this.name);
    this.start();
  }

  start() {
    const that = this;
    setTimeout(() => {
      that.runNext();
    }, 0);
  }

  say(what) {
    console.log(what);
  }

  addTask(fn) {
    this.tasks.push(fn);
  }

  runNext() {
    const task = this.tasks.shift();
    task && task();
  }
  @taskDecorator(false)
  sleep(time, next?) {
    console.log("waiting: sleep for " + time);
    setTimeout(() => {
      next && next();
    }, time * 1000);
    return this;
  }

  @taskDecorator(true)
  go(where) {
    this.say("go: " + where);
    return this;
  }

  @taskDecorator(true)
  eat(what) {
    this.say("Eat an " + what);
    return this;
  }
}

var aa = new Human("jack")
  .sleep(3)
  .go("home")
  .eat("apple")
  .sleep(2)
  .eat("apple too");

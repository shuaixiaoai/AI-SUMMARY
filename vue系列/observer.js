// 声明Observer类
function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    walk: data => {
        let me = this;
        Object.keys.forEach(key => {
            me.convert(key, data[key]);
        });
    },
    convert: (key, val) => {
        console.log(this)
        this.defineReactive(this.data, key, val);
    },
    defineReactive: (data, key, val) => {
        console.log(this)
        let dep = new dep();
        let childObj = observe(val);

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                if (dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if (newVal === val) return;
                val = newVal;
                // 新的值是object的话，需要进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        })
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') return;
    return new Observer(value);
}

let uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: sub => this.subs.push(sub),
    depend: () => Dep.target.addSub(this),
    removeSub: sub => {
        let index = this.subs.indexOf(sub);
        if (index != -1) this.subs.splice(index, 1);
    },
    notify: () => {
        this.subs.forEach(sub => {
            sub.update();
        })
    }
};

Dep.target = null;

export default {
    Observer
}
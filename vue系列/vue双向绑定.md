### vue双向绑定

```
    // 双向绑定
    // 发布订阅模式： 一般通过sub、pub的方式实现数据和视图的绑定监听，更新数据方式通常做法vm.set('property', value),
    // 脏值检测： angular.js是通过脏值检测的方式对比数据是否变化， 来决定是否更新视图， 最简单的方式就是通过setInterval()定时轮询检测数据变动， angular只有在指定的事件触发是进入脏值检测
    // 数据劫持： vuejs采用的数据劫持结合发布订阅模式， 通过Object.defineProperty()来劫持各个属性的setter、setter在数据变动是发布消息给订阅者，触发响应的监听回调
    // 思路： 1、实现一个数据监听器Observer， 能够对数据对象的所有属性进行监听， 如有变动可拿到最新值并通知订阅者
    //       2、实现一个指令解析器Compiler， 对每个元素节点的指令进行扫描和解析， 根据指令模板替换数据， 以及绑定相应的更新函数
    //       3、实现一个watcher， 作为Observer和Compiler的桥梁， 能够订阅并收到每个属性变动的通知， 执行指令绑定的相应回调函数，从而更新视图
    //       4、mvvm入口函数整合以上三者

    // 实现Observer
    var data = { name: 'ketty' };

    function observe(data) {
        if (!data || typeof data !== 'object') return;
        // 取出所有属性遍历
        Object.keys(data).forEach(function (key) {
            defineReactive(data, key, data[key]);
        })
    }
    // 实现消息订阅器， 维护一个数组， 用来收集订阅者， 数据变动触发notify， 再调用订阅者的update方法
    function defineReactive(data, key, val) {
        var dep = new Dep();
        observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,               // 可枚举
            configurable: false,                    // 不能再define
            get: () => {
                // 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性， 暂存watcher， 添加完移出
                Dep.target && dep.addDep(Dep.target);
                return val
            },
            set: newVal => {
                console.log('监听到值变化了', val, '---->', newVal);
                val = newVal;
                dep.notify();                   // 通知所有订阅者
            }
        })
    }

    function Dep() {
        this.subs = [];
    }
    Dep.prototype = {
        addSub: sub => this.subs.push(sub),
        notify: () => {
            this.subs.forEach( sub => sub.update() );
        }
    }

    Watcher.prototype = {
        get: key => {
            Dep.target = this;
            this.value = data[key];
            Dep.target = null;
        }
    }


    // 实现Compiler： 主要做的是解析模板指令， 将模板中的变量替换城数据，然后初始化渲染页面的视图。
    // 并将每个指令对应的节点绑定更新函数， 添加监听数据的订阅者， 一旦数据变动， 收到通知， 更新视图
    function Compile(el) {
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);
        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this.init();
            this.$el.appendChild(this.$fragment);
        }
    }
    Compile.prototype = {
        init: function () { this.compileElement(this.$fragment);},
        node2Fragment: el => {
            var fragment = document.createDocumentFragment(), child;
            // 将原生节点拷贝到fragment
            while (child = el.firstChild) {
                fragment.appendChild(child);
            }
            return fragment;
        },
        compileElement: el => {
            var childNodes = el.childNodes;
            var me = this;
            [].slice.call(childNodes).forEach( node => {
                var text = node.textContent;
                var reg = /\{\{(.*)\}\}/;               // 表达式文本
                // 按元素节点方式编译
                if (me.isElementNode(node)) {
                    me.compile(node);
                } else if (me.isTextNode(node) && reg.test(text)) {
                    me.compileText(node, regExp.$1);
                }
                // 遍历编译子节点
                if (node.childNodes && node.childNodes.length) {
                    me.compileElement(node);
                }
            } )
        },
        compile: node => {
            var nodeAttrs = node.attributes, me = this;
            [].slice.call(nodeAttrs).forEach(arrt => {
                // 规定： 指令已v-xxx
                var attrName = attr.name;
                if (me.isDirective(attrName)) {
                    var exp = attr.value;               // content
                    var dir = attrName.substring(2);                // text
                    if (me.isEventDirective(dir)) {
                        // 事件指令
                        compileUtil.eventHandler(node, me.$vm, exp, dir);
                    } else {
                        compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                    }
                }
            })
        }
    }

    // 指令处理集合
    var compileUtil = {
        text: function(node, vm, exp) {
            this.bind(node, vm, exp, 'text');
        },
        bind: (node, vm, exp, dir) => {
            var updateFn = update[dir + 'Updater'];
            // 第一次初始化视图
            updateFn && updateFn(node, vm[exp]);
            // 实例化订阅者， 此操作在对应的属性消息订阅器中添加了该订阅者watcher
            new Watcher(vm, exp, function (value, oldValue) {
                // 一旦属性有变化， 会受到通知执行此更新函数， 更新视图
                updateFn && updateFn(node, value, oldValue);
            })
        }
    }
    // 更新函数
    var update人= {
        textUpdater: (node, value) => {
            node.textContent = typeof value == 'undefined' ? '' : value
        }
    }
    
    //  这里通过递归遍历保证了每个节点以及子节点都会解析编译到， 包括了{{}}表达式声明的文本节点， 指令的声明规定是通过特定前缀的节点属性来标记。 监听数据、绑定更新函数的处理是在compileUtil.bind()中， 通过new Watcher()添加回调来接收数据变化的停止

    // 实现Watcher
    // Watcher订阅者作为Observer和Compiler之间的桥梁
    // 1、在自身实例化时往属性订阅器（dep）里面添加自己
    // 2、自身必须有一个update()方法
    // 3、待属性变动dep.notice()通知时， 能调用自身的update()方法， 并处罚Compiler中绑定的回调

    function Watcher(vm, exp, cb) {
        this.cb = cb;
        this.vm = vm;
        this.exp = exp;
        // 此处为了触发属性的getter， 从而在dep添加自己， 结合Observer更易理解
        this.value = this.get();
    }
    Watcher.prototype = {
        update: () => this.tun(),                       // 属性值变化受到通知
        run: () => {
            var value = this.get();
            var oldValue = this.value;

            if (value !== oldValue) {
                this.value = value;
                this.cb.call(this.vm, value, oldValue);             // 执行compile中绑定的回调， 更新视图
            }
        },
        get: () => {
            Dep.target = this;              // 将当前订阅者指向自己
            var value = this.vm[exp];       // 触发getter， 添加自己导属性订阅器中
            Dep.target = null;
            return value;
        }
    }

    // 再次调用Observer和Dep
    Object.defineProperty(data, key, {
        get: function () {
            // 由于需要在闭包内添加watcher， 所以可以在Dep定义一个全局target属性， 暂存watcher， 添加完移除
            Dep.target && dep.addDep(Dep.target);
            return vale;
        }
    })
    Dep.prototype = {
        notify: function () {
            this.subs.forEach(sub => {
                sub.update();                       // 调用订阅者的update方法， 通知变化
            })
        }
    }



    // 实例化Watcher的时候， 调用get()方法， 通过Dep.target = watcherInstance标记订阅者是当前watcher实例， 强行触发属性定义的getter方法， getter方法执行的时候
    // 就会在属性的订阅器dep添加当前watcher实例， 从而咋属性值有变化的时候， watcherInstance就能收到更新通知


    // 实现MVVM： 作为数据绑定的入口， 整合Observer、Compile和Watcher三者， 通过Observer来监听自己的model数据变化， 通过Compile来解析编译模板指令， 最终利用Watcher搭起Observer和Compile之间的通信桥梁，
    // 达到数据变化 --> 视图更新； 视图交互变化 --> 数据model变更的双向绑定效果

    function MVVM(options) {
        this.$options = options;
        var data = this._data = this.$options.data;
        var me = this;
        // 属性代理， 实现vm.xxx --> vm._datat.xxx
        Object.keys(data).forEach(key => {
            me._proxy(key);
        })
        observe(data, this);
        this.$compile = new Compile(options.el || document.body, this)
    }
    MVVM.prototype = {
        _proxy: function (key) {
            var me = this;
            Object.defineProperty(me, key, {
                configurable: false,
                enumerable: true,
                get: function proxyGetter() {
                    return me._data[key];
                },
                set: function proxySetter(newVal) {
                    me._data[key] = newVal;
                }
            })
        }
    }
    // 利用ObjectProperty()这个方法来劫持了vm实例对象的属性的读写权， 使读写vm实例的属性转换成读写vm._data的属性值。
```
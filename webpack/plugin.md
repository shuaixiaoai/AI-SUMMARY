### 编写Plugin

```
// 最基础的plugin的代码
class BasicPlugin {
    // 在构造函数中获取用户为该插件传入的配置
    constructor(options) {
    }

    // webpack会调用BasicPlugin实例的apply方法为插件实例传入compiler对象
    apply(compiler) {
        compiler.plugin('compilation', function (compilation) {
        })
    }
}

// 导出Plugin
module.exports = BasicPlugin;

// 在使用这个Plugin时，在webpack配置文件，做相关的配置代码如下：
const BasicPlugin = require('./BasicPlugin.js');
module.export = {
    plugins: [
        new BasicPlugin(options);
    ]
}
```

#### webpack启动后， 在读取配置的过程中会先执行new BasicPlugin(options), 初始化一个BasicPlugin并获得其实例。在初始化compiler对象后， 在调用basicPlugin。 apply(compiler)为插件插入实例传入compiler对象。 插件实例获得compiler后， 就可以通过compiler.plugin（事件名， 回调函数）监听到webpack广播的事件并且可以通过compiler对象去操作webpack。


### Compiler 和 Compilation
#### `Compiler`对象包含了webpack环境的所有配置信息， 包含`options、loaders、plugins`等信息。 这个对象在webpack启动时被初始化， 它是全局唯一的， 可以简单地将它理解为webpack的实例。
#### `Compilation`对象包含了当前的模块资源、编译生成资源、变化的文件等等。 当webpack以开发模式运行时， 每当检测到一个文件发生变化， 便有一次新的Compilation被创建。 Compilation也提供了很多事件回调供插件进行扩展。 通过Compilation也能读取到Compiler对象。

#### 二者区别： `Compiler代表了整个webpack从启动到关闭的生命周期、而Compilation只代表一次新的编译`。


### 事件流

#### webpack就像一条生产线， 要经过一系列的处理流程后才能将源文件转换成输出结果。 这条生成线的每个处理流程的职责是单一的， 多个流程之间存在依赖关系， 只有完成当前处理后才能提交给下一个流程去处理。  webpack在运行的过程中会广播事件， 插件只需要监听它关心的事件， 就能加入了这条生产线中， 去修改生产线的运作。 webpack的事件流机制保证了插件的有序性， 使得整个系统的扩展性良好。 事件流机制（观察者模式）：
```
/**
*   广播事件
*   event-name 为事件名称， 注意不要和现有的事件重名
*   params为附带的参数
*/
compiler.apply('event-name', params);

// 监听名称为event-namede事件， 当event-name事件发生时， 函数就会发生
// 同时函数中的params参数为广播事件时附带的参数
compiler.plugin('event-name', function (params) {
});

// 同理， compilation.apply和compilation.plugin的使用方法如上
// 在开发插件时， 需要注意： 只要能拿到Compiler和compilation对象， 就能广播新的事件， 所以在新开发的插件中也能广播事件， 为其他插件监听使用。  传给每// 个插件的Compiler和Compilation对象都是同一个引用。 也就是说， 若在一个插件中修改了Compiler和Compilation对象上的属性， 就会影响到后面的插件。 第二// 个参数为回调函数， 在插件处理完任务时需要调用回调函数通知webpack， 才会进入到下一个处理流程。 如下：

compiler.plugin('emit', function (compilation, callback) {
    // 处理逻辑
    // 处理完毕后执行callback以通知webpack
    // 如果不执行callback， 运行流程会一直卡在这里而不往后执行
    callback();
});

```
#### plugin 常用API
1、 读取输出资源、代码块、模块及其依赖          
某些插件可能需要读取webpack的处理结果， 如： 输出资源、代码块、 模块及其依赖。 当emit事件发生时， 代表源文件的转换和组装已经完成， 在这里可以读取到最终的输出资源、代码块、模块及其依赖， `并且可以修改输出资源的内容`,
```
// 插件代码如下
class Plugin {
    apply(compiler) {
        compiler.plugin('emit', function (compilation, callback) {
            // Compilation.chunks存放所有的代码块， 是一个数组
            compilation.chunks.forEach(function (chunk) {
                // chunk代表一个代码块
                // 代码块由多个模块组成， 通过chunk.forEachModule能读取代码块的每个模块
                chunk.forEachModule(function (module) {
                    // module代表一个模块
                    // module.fileDependencies存放当前模块的所有依赖的文件路径， 是一个数组
                    module.fileDependencies.forEach(function (filepath) {
                        // 处理逻辑
                    });
                });

                // webpack会根据chunk生成输出的文件资源，每个chunk都对应一个及以上的输出文件
                // 例如在chunk中包含css模块并且使用了ExtractTextPlugin时，该chunk就会生成.js和.css两个文件
                chunk.files.forEach(function (filename) {
                    // compilation.assets存放当前即将输出的所有资源
                    // 调用一个输出资源的source()方法能获取输出资源的内容
                    let source = compilation.assets[filename].source();
                });
            });

            // 这是一个异步事件， 需要调用callback通知webpack本次事件监听处理结束
            // 若忘记调用callback， 则webpack将一直卡死在这里不会往后执行
            callback();
        });
    }
}

```

2、 监听文件变化            
Webpack会从entry配置的入口文件出发， 依次找出所有的依赖， 当入口文件、模块及其依赖发送变化时会触发一次新的Compilation。         
在开发Plugin时， 要知道哪个文件发生了变化导致新的Compilation， 如下代码：
```
// 当依赖的文件发生变化时会触发watch-run事件
compiler.plugin('watch-run', (watching, callback) => {
    // 获取发生的文件列表
    const changedFiles = watching.compiler.watchFileSystem.watcher.mtimes;
    // changedFiles格式为键值对， 键为发生变化的文件路径
    if (changedFiles[filename] !== undefined) {
        // filename对应的文件发生了变化
    }
    callback();
});
```
默认情况下， webpack只会监视入口和其依赖的模块是否发生了变化， 在某些情况下项目可能需要引入新的文件。 由于javascript文件不会导入HTML文件， 所以webpack不会监听html的变化。 编辑html时， 不会触发新的Compilation。 为了监听HTML变化， 需要将html加入依赖列表， 则如下代码可以实现：
```
compiler.plugin('after-compiler', (compilation, callback) => {
    // 将html文件添加到文件依赖中， 好让webpack监听html模板文件， 在html文件发生变化时编译一遍
    compilation.fileDependencies.push(filename);
    callback();
})
```

3、 修改输出资源            
某些场景中， 插件需要修改、增加、删除输出的资源， 则需要emit事件， 因为emit事件时所有模块的转换和代码块对应的文件已经生成好， 需要输出的资源即将输出， 因此emit事件是修改webpack输出的资源的最后机会。          
所有需要输出的资源都会被存在compilation.assets中， compilation.asset是一个键值对， 键为需要输出的文件名称， 值为文件对应的内容。

```
// 设置compilation.asset代码如下：
compiler.plugin('emit', (compilation, callback) => {
    // 设置名称为filename的输出资源
    compilation.assets[filename] = {
        // 返回文件内容
        source: () => {
            // fileContent既可以代表文本文件的字符串，也可以是二进制文件的buffer
            return fileContent;
        },
        // 返回文件的大小
        size: () => {
            return Buffer.byteLength(fileContent, 'utf-8');
        }
    };
    callback();
});

// 读取compilation.asset代码如下：
compiler.plugin('emit', (compilation, callback) => {
    // 读取名称为filename的输出资源
    const assets = compilation.assets[filename];

    // 获取输出资源的内容
    assets.source();

    // 获取输出资源的文件大小
    assets.size();
    callback();
});
```

4、 判断webpack使用了哪些插件           
在开发插件时， 需要根据当前配置是否使用了其他的插件来做下一步决定。 因此需要读取webpack当前的插件配置情况。 比如， 若想判断当前是否使用了ExtractTextPlugin， 则如下代码：               
```
// 判断当前配置是否使用了ExtractTextPlugin，
// compiler参数为webpack在apply(compiler)中传入的参数
function hasExtractTextPlugin(compiler) {
    // 当前配置使用的所有插件列表
    const plugins = compiler.options.plugins;
    // 去plugins中寻找有没有ExtractTextPlugin的实例
    return plugins.find(plugin => plugin.__proto__.constructor === ExtractTextPlugin) !== null;
}
```
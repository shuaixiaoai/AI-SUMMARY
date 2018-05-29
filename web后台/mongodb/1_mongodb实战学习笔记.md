## javascript shell操作mongodb基础命令方法
***
1、启动： `brew services start mongodb`;

2、重启： `brew services restart mongodb`
### 插入和查询
1、`db.users.insert({ username: 'xiaoai' });  `      --> 插入

2、`db.users.find({}); `                             --> 查询

3、`db.users.count(); `                              --> 统计

4、 查询操作， 可用$and操作符。
  `db.users.find({ $and: [
    { _id: '' },
    { name: 'shuaixiaoai' }
  ]})`
### 更新文档
1、 `db.users.update({ uaername: 'shuaixiaoai' }, {$set: { country: "Canada" } })`           --> 更新username为shuaixiaoai的country

2、 替换更新
    `db.users.update({ username: "shuaixiaoai" }, { country: "Canada" })`         --> 文档被替换为只包含country地段的文档

3、删除字段 `db.users.update({ username: "shuaixiaoai" }, { "$unset": {country: 1 } })`

### 更新复杂字段
`db.users.update({ username: "shuaixiaoai" },
  { $set: {
    favorites: {
      cities: ["Chicago", "Cheyenne"],
      movies: ["Casablanca", "For  a Few Dollars", "The String"]
    }
  }
})`

### 高级更新
1、给列表添加数据， 最好使用$push、$addToSet, 第二个是唯一的，阻止了重复的数据

`
  db.users.update({ "favorites.movies": "Casablanca" },
    { $addToSet: { "favorites.movies": "The Maltese Falcon" }},
      false,
      true
  )
`

其中， 第一个参数为查询条件， 第二个参数为$addToSet添加的The Maltese Falcon， 第三个参数false表示是否允许upset, 这个命令告诉更新操作，
当一个文档不存在的时候是否插入它， 这取决于更新操作符是操作符更新还是替换更新， 第四个参数表示是否是多个更新。 默认情况下， mongoDB更新只针
第一个匹配文档。 如果想更新多个文档， 就必须显示指定这个参数。

### 通过find().pretty()操作获取从服务端返回的良好格式的结构

### 删除数据
1、 `db.foo.remove()`    -->  如果没有传入参数， 删除操作将会清空集合里的所有文档。 如果要删除集合中的某个文档， 要传入查询选择器给remove()

2、 remove() 不会删除集合， 只会删除文档

3、 删除集合及其附属的文档 `db.users.drop()`


***
## 使用索引创建和查询

1、创建大集合， count命令会计算所有文档， find()只会显示前20条， 可使用it命令显示其余结果；

2、范围查询$gt, $lt  `db.numbers.find({ num: { $gt: 20 }})`       --> 查询num大于20的数据
                   `db.numbers.find({ num: { $lg: 20 }})`       --> 查询num小于20的数据
                   `db.numbers.find({ num: { $gt: 20, $lg: 50 }})`       --> 查询num大于20小于50的数据

### 索引和explain
1、explain描述了查询路径并且允许开发者通过确定查询使用的索引来诊断慢的查询语句。
`db.numbers.find({ num: {$gt: 50}}).explain("executionStats")`

2、 创建索引， 使用createIndex()方法为num创建索引 `db.numbers.createIndex({num: 1})` ， 会创建除了_id之外额外的索引

3、通过`db.numbers.getIndexes()`方法来检验索引是否创建成功

***
## MongoDB基本管理
1、 获取数据库信息    -->  `show dbs` 打印系统中所有的数据库列表信息

2、 展示数据库里所有的集合   --> `show collections`

3、 `db.stats(), db.numbers.stats()`  -->  可查看数据库、某个集合的详细信息。

4、 输出数据库 `db.dropDatabase()`

### 命令如何执行
1、数据库命令， 通常是管理性的。 如上， stats方法包装了shell命令的方法调用， 通常， 我们可以通过给runCommand()方法传递参数来调用任意命令
如： `db.runCommand({ dbstats: 1 }), db.runCommand({ collstats: "numbers" })`

2、 可以使用`db.runCommand`查看内部机制

3、获取帮助。 db.help() 打印通常数据库使用的操作方法， 例如： `db.numbers.help()`可以找到像是的方法列表；

4、查看实现代码， 例如： db.numbers.save














<!--  -->

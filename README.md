# wechat-user-iterator

微信信息列表迭代器。

### Usage

```bash
npm i @neuroo_fe/wechat-user-iterator -S
```

```javascript
const UserIterator = require('@neuroo_fe/wechat-user-iterator')
const iterator = new UserIterator({
  appId: '',
  appSecret: ''
})

iterator
  .on('user', console.log)
  .on('error', console.error)
  .on('finish', console.log)
  .start()
```

### UserIterator

`new UserIterator(options)` 返回`UserIterator`实例对象。

#### options 参数属性

| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| appId | String | 特殊可选 | 微信公众号appId |
| appSecret | String | 特殊可选 | 微信公众号appSecret |
| getToken | Function | 特殊可选 | 获取access_token函数。<br/>当使用此参数时，可省略`appId`和`appSecret`。<br/>详情见[wechat-api 多进程](https://github.com/node-webot/wechat-api#多进程) |
| concurrent | Number | 否 | 并发数。默认为1 |

### UserIterator实例方法

- [start() 开始迭代](#start)
- [stop() 暂停迭代](#stop)
- [resume() 恢复迭代](#resume)

#### start

开始迭代用户信息列表，会多次触发`user`事件。完成时会触发`finish`事件。

#### stop

暂停迭代。

#### resume

恢复迭代。

### UserIterator实例事件

- [user 获取到单个用户信息时触发](#user)
- [users 获取到多个用户信息时触发](#users)
- [finish 完成迭代时触发](#finish)
- [error 获取信息出错时触发](#error)

#### user

获取到单个用户信息时触发`user`事件

#### result 参数属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| current | Number | 当前用户的下标。 |
| total | Number | 所有用户的数量。 |
| user | Object | 用户信息对象。 |

### users

获取到多个用户信息时触发`users`事件

#### result 参数属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| current | Number | 当前用户的下标。 |
| total | Number | 所有用户的数量。 |
| users | Array | 多个用户信息对象数组。 |

### finish

完成迭代时触发。

#### result 参数属性

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| total | Number | 所有用户的数量。 |
| startTime | String | 开始时间。 |
| endTime | String | 结束时间。 |

### error

获取信息出错时触发`error`事件。参数为`Error`实例对象。
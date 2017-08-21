const WechatAPI = require('wechat-api')
const EventEmitter = require('events')
const async = require('async')

class Iterator extends EventEmitter {
  constructor (options) {
    super()
    this.task = {
      total: 0,
      concurrent: options.concurrent || 10,
      current: 0,
      group: [],
      isStop: false,
      isStart: false,
      nextOpenid: '',
      pending: []
    }
    this.api = new WechatAPI(options.appId, options.appSecret, options.getToken)
  }

  start () {
    if (this.task.isStart) {
      return
    }
    this.task.isStart = true
    this.getFollowers()
  }

  stop () {
    this.task.isStop = true
  }

  resume () {
    if (!this.task.isStop) {
      return
    }
    this.task.isStop = false
    if (this.task.pending.length > 0) {
      const tmpArr = this.task.pending.concat()
      this.task.pending = []
      this.getUsers(tmpArr)
    } else if (this.task.nextOpenid) {
      this.getFollowers()
    }
  }

  getUsers (group) {
    async.eachLimit(group, this.task.concurrent, this.batchGetUsers.bind(this), (err, result) => {
      this.getFollowers()
    })
  }

  batchGetUsers (openIds, callback) {
    if (this.task.isStop) {
      this.task.pending.push(openIds)
      return callback()
    }
    this.api.batchGetUsers(openIds, (err, result) => {
      if (err) {
        this.emit('error', err)
        return callback(null, err)
      }
      result.user_info_list.forEach(user => {
        this.emit('user', {
          user: user,
          current: this.task.current++,
          total: this.task.total
        })
      })
      this.emit('users', result.user_info_list)
      callback(null, result)
    })
  }

  getFollowers () {
    if (this.task.isStop) {
      return
    }
    const callback = (err, result) => {
      if (err) {
        return this.emit('error', err)
      }
      if (result.count === 0) {
        return this.emit('finish', {
          total: this.task.total
        })
      }
      this.task.total = result.total
      this.task.nextOpenid = result.next_openid
      this.task.group = this.grouping(result.data.openid, 100)
      this.getUsers(this.task.group)
    }
    if (this.task.nextOpenid) {
      this.api.getFollowers(this.task.nextOpenid, callback)
    } else {
      this.api.getFollowers(callback)
    }
  }

  grouping (arr, limit) {
    const newArr = []
    for (let i = 0, len = arr.length; i < len; i += limit) {
      newArr.push(arr.slice(i, i + limit))
    }
    return newArr
  }
}

module.exports = Iterator
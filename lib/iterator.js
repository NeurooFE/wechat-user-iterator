const WechatAPI = require('wechat-api')
const EventEmitter = require('events')
const async = require('async')

class Iterator extends EventEmitter {
  constructor (options) {
    super()
    this.task = {
      current: 0,
      error: 0,
      total: 0,
      concurrent: options.concurrent || 1,
      group: [],
      isStop: false,
      isStart: false,
      nextOpenid: '',
      pending: []
    }
    this.bench = {
      startTime: 0,
      endTime: 0
    }
    this.api = new WechatAPI(options.appId, options.appSecret, options.getToken)
  }

  start () {
    if (this.task.isStart) {
      return
    }
    this.bench.startTime = Date.now()
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
    const _callback = (err, result) => {
      if (err) {
        this.emit('error', err)
        this.error += openIds.length
        return callback(null, err)
      }
      result.user_info_list.forEach(user => {
        this.emit('user', {
          user: user,
          current: this.task.current++,
          total: this.task.total
        })
      })
      this.emit('users', {
        users: result.user_info_list,
        current: this.task.current,
        total: this.task.total
      })
      callback(null, result)
    }
    this.api.batchGetUsers(openIds, this.fixIncludeEmoji(_callback))
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
        this.bench.endTime = Date.now()
        return this.emit('finish', {
          total: this.task.total,
          startTime: (new Date(this.bench.startTime)).toLocaleString(),
          endTime: (new Date(this.bench.endTime)).toLocaleString()
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

  fixIncludeEmoji(callback) {
    return function (err, result) {
      let data = null
      if (err) {
        if (err.name !== 'WeChatAPIJSONResponseFormatError') {
          return callback(err)
        }
        try {
          let str = err.data
          str = str.replace(/([\u0000-\u0020]|[\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '')
          data = JSON.parse(str)
        } catch(err2) {
          return callback(err2)
        }
      }
      callback(null, data || result)
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
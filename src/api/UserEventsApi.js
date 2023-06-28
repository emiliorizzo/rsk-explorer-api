import path from 'path'
import { fork } from 'child_process'
import config from '../lib/config'
import { errors, formatRes } from './lib/apiTools'
import Logger from '../lib/Logger'

function UserEventsSocket () {
  return fork(path.resolve(__dirname, '../services/userEvents/userEventsService.js'))
}

const log = Logger('[user-events-api]')

export const UserEventsApi = (io, api) => {
  if (!config.api.allowUserEvents) return
  log.info('Online')

  log.info('Starting user events service...')
  const userEvents = UserEventsSocket()

  userEvents.on('message', async msg => {
    try {
      const { payload, module } = msg
      const action = payload.action
      const res = await processMsg(msg, api)
      let result = res.data
      let req = payload
      let error = res.error
      if (!msg.socketId) return
      const socket = io.sockets.connected[msg.socketId]
      log.trace(`Sending message to client ${module}.${action} error:${JSON.stringify(error)}`)
      if (socket) socket.emit('data', formatRes({ module, action, result, req, error }))
    } catch (err) {
      log.error(err)
      return Promise.reject(err)
    }
  })
  return Object.freeze(userEvents)
}

async function processMsg (msg, api) {
  let data, error
  if (!msg.error) {
    if (msg.data) {
      data = msg
    } else {
      const { result } = await api.run(msg.payload)
      data = result
    }
  } else {
    error = errors[msg.error.code] || errors.INVALID_REQUEST
    data = msg.result
  }
  return { data, error }
}

export default UserEventsApi

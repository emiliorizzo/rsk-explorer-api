// TODO: Delete mongodb related code after migration
import { MongoClient } from 'mongodb'
import { LogProxy } from './Logger'

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true }
export class Db {
  constructor (config) {
    config = config || {}
    const { server, port, password, user, db, database } = config
    this.server = server || 'localhost'
    this.port = port || 27017
    this.dbName = database || db
    if (!this.dbName) throw new Error('Missing database name')
    let url = 'mongodb://'
    if (user && password) url += `${user}:${password}@`
    url += `${this.server}:${this.port}/${this.dbName}`
    this.url = url
    this.client = null
    this.log = undefined
    this.DB = undefined
    this.setLogger(config.Logger || console)
    this.connect()
  }
  async connect () {
    try {
      if (!this.client) {
        this.client = await MongoClient.connect(this.url, connectionOptions)
      }
      return this.client
    } catch (err) {
      return Promise.reject(err)
    }
  }

  async db () {
    try {
      if (this.DB) return this.DB
      let client = await this.connect()
      this.DB = client.db(this.dbName)
      return this.DB
    } catch (err) {
      return Promise.reject(err)
    }
  }

  setLogger (log) {
    this.log = (log && log.constructor && log.constructor.name === 'Logger') ? log : LogProxy(log)
  }

  getLogger () {
    return this.log
  }

  async createCollection (collectionName, { indexes, options } = {}, { dropIndexes, validate } = {}) {
    try {
      const db = await this.db()
      if (!collectionName) throw new Error('Invalid collection name')
      let list = await db.listCollections({}, { nameOnly: true }).toArray()
      let exists = list.find(c => c.name === collectionName)
      if (!exists) await db.createCollection(collectionName, options)
      let collection = db.collection(collectionName)
      if (dropIndexes) {
        this.log.info(`Removing indexes from ${collectionName}`)
        await collection.dropIndexes()
      }
      if (indexes && indexes.length) {
        this.log.info(`Creating indexes to ${collectionName}`)
        await collection.createIndexes(indexes)
      }
      if (validate) await this.validateCollection(db, collectionName)
      return collection
    } catch (err) {
      return Promise.reject(err)
    }
  }

  validateCollection (db, collectionName) {
    this.log.info(`Validating collection: ${collectionName}`)
    return db.admin().validateCollection(collectionName)
  }

  createCollections (collections, creationOptions = {}) {
    let queue = []
    let names = creationOptions.names || {}
    for (let c in collections) {
      let name = names[c] || c
      queue.push(this.createCollection(name, collections[c], creationOptions)
        .then(collection => {
          this.log.info(`Created collection ${name}`)
          return collection
        })
        .catch(err => {
          this.log.error(`Error creating collection ${name} ${err}`)
          return Promise.reject(err)
        })
      )
    }
    return Promise.all(queue)
  }

  insertMsg (insertResult, data, dataType) {
    let count = (data) ? data.length : null
    let msg = ['Inserted', insertResult.result.n]
    if (count) {
      msg.push('of')
      msg.push(count)
    }
    if (dataType) msg.push(dataType)
    return msg.join(' ')
  }
}
export default Db

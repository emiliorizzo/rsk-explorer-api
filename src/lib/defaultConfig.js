/**
 *  This file provides default values,
 *  use /config.json, to overwrite settings
 */
import { txTypes } from './types'
import delayedFields from './delayedFields'

export default {
  source: {
    protocol: 'http',
    node: 'localhost',
    port: 4444,
    url: null
  },
  log: {
    dir: '/var/log/rsk-explorer',
    level: 'error'
  },
  db: {
    server: 'localhost',
    port: 27017,
    database: 'blockDB'
  },
  api: {
    address: 'localhost',
    port: 3003,
    lastBlocks: 30,
    MIN_LIMIT: 10,
    LIMIT: 50,
    MAX_LIMIT: 500,
    MAX_PAGES: 10,
    allowUserEvents: true,
    delayedFields
  },
  publicSettings: {
    bridgeAddress: '0x0000000000000000000000000000000001000006',
    remascAddress: '0x0000000000000000000000000000000001000008',
    txTypes
  },
  blocks: {
    blocksQueueSize: 100,
    validateCollections: false,
    bcTipSize: 12,
    batchRequestSize: 20,
    collections: {
      Blocks: 'blocks',
      Txs: 'transactions',
      Addrs: 'addresses',
      Status: 'status',
      Events: 'events',
      TokensAddrs: 'tokensAddresses',
      OrphanBlocks: 'orphanBlocks',
      TxPool: 'txPool',
      PendingTxs: 'transactionsPending'
    }
  }
}

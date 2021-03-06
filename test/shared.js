import crypto from 'crypto'

export const fakeBlocks = (count = 10, max) => [...new Array(count)].map(i => fakeBlock(max))

export const randomBlockHash = () => '0x' + crypto.randomBytes(32).toString('hex')

export const randomBlockNumber = (max) => {
  max = max || 10 ** 6
  return Math.floor(Math.random() * max)
}

export const fakeBlock = (max) => {
  let number = randomBlockNumber(max)
  let hash = randomBlockHash()
  return { hash, number }
}

export const fakeTx = (transactionIndex, { hash, number }) => {
  let blockHash = hash || randomBlockHash()
  let blockNumber = number || randomBlockNumber()
  return { blockHash, blockNumber, transactionIndex }
}

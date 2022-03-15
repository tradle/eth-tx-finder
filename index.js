const EthQuery = require('@tradle/eth-store/query')
const debug = require('debug')('tradle:eth-tx-finder')
const findIncrements = require('./disect.js')
const pMap = import('p-map').then(pmap => pmap.default)
const pQueue = import('p-queue').then(pqueue => pqueue.default)
const MAX_CONCURRENT = 5

function rangeToArray (min, max) {
  const arr = []
  for (let i = min; i <= max; i++) {
    arr.push(i)
  }
  return arr
}

function flatten (arr) {
  return arr.reduce(function (all, some) {
    return all.concat(some)
  }, [])
}

async function findAllTxsTo (provider, targetAddress, onTx) {
  const query = new EthQuery(provider)
  const blockNumberHex = await query.getLatestBlockNumber()
  const blockNumber = parseInt(blockNumberHex, 16)
  return await findAllTxsInRangeTo(provider, targetAddress, 0, blockNumber, onTx)
}

async function findAllTxsInRangeTo (provider, targetAddress, minBlockNumber, maxBlockNumber, onTx) {
  const query = new EthQuery(provider)
  const results = await (await pMap)(
    rangeToArray(minBlockNumber, maxBlockNumber),
    async function (blockNumber) {
      const block = await query.getBlockByNumber(blockNumber)
      const matchingTxs = block.transactions.filter(tx => tx.to === targetAddress)
      matchingTxs.forEach(onTx)
      return matchingTxs
    },
    { concurrency: MAX_CONCURRENT }
  )

  return flatten(results)
}

async function findAllTxs (provider, targetAddress, onTx) {
  const query = new EthQuery(provider)
  const blockNumberHex = await query.getLatestBlockNumber()
  const blockNumber = parseInt(blockNumberHex, 16)
  return await findAllTxsInRange(provider, targetAddress, 0, blockNumber, onTx)
}

async function findAllTxsInRange (provider, targetAddress, minBlockNumber, maxBlockNumber, onTx) {
  const query = new EthQuery(provider)
  const nonceLookup = memoize(block => {
    debug('nonce', targetAddress, block)
    return query.getNonce(targetAddress, block)
  })
  let results = []
  const queue = new (await pQueue)({ concurrency: MAX_CONCURRENT })

  debug('Looking for blocks', minBlockNumber, maxBlockNumber)

  await findIncrements(minBlockNumber, maxBlockNumber, nonceLookup, blockNumber => {
    queue.add(async () => {
      debug('Looking for block', blockNumber)
      const block = await query.getBlockByNumber(blockNumber)
      const matchingTxs = block.transactions.filter(tx => {
        return tx.from === targetAddress
      })
      results = [
        ...results,
        ...matchingTxs
      ]
      matchingTxs.forEach(onTx)
    })
  })
  await queue.onIdle()

  return results.sort((txA, txB) => txA.blockNumber < txB.blockNumber)
}

// util
function memoize (fn, cacheHit, cacheMiss) {
  cacheHit = cacheHit || noop
  cacheMiss = cacheMiss || noop
  // TODO: turn into LRU cache
  const cache = {}
  return async function (index) {
    // try cache
    let result = cache[index]
    if (result === undefined) {
      cacheMiss()
      // fallback to request
      result = await fn(index)
      cache[index] = result
    } else {
      cacheHit()
    }
    return result
  }
}

function noop () {}

module.exports = {
  findAllTxs,
  findAllTxsInRange,
  findAllTxsTo,
  findAllTxsInRangeTo
}

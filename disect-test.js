const findIncrements = require('./disect')

const testParams = [
  { txCount: 1, blockchainLength: 2e6 },
  { txCount: 1, blockchainLength: 2e6 },
  { txCount: 1, blockchainLength: 2e6 },

  { txCount: 2, blockchainLength: 2e6 },
  { txCount: 2, blockchainLength: 2e6 },
  { txCount: 2, blockchainLength: 2e6 },

  { txCount: 10, blockchainLength: 2e6 },
  { txCount: 10, blockchainLength: 2e6 },
  { txCount: 10, blockchainLength: 2e6 },

  { txCount: 20, blockchainLength: 2e6 },
  { txCount: 20, blockchainLength: 2e6 },
  { txCount: 20, blockchainLength: 2e6 },

  { txCount: 50, blockchainLength: 2e6 },
  { txCount: 50, blockchainLength: 2e6 },
  { txCount: 50, blockchainLength: 2e6 },

  { txCount: 100, blockchainLength: 2e6 },
  { txCount: 100, blockchainLength: 2e6 },
  { txCount: 100, blockchainLength: 2e6 }
]

;(async () => {
  const res = []
  for (const params of testParams) {
    const { txCount, blockchainLength } = params
    res.push({
      params,
      results: await performTest(txCount, blockchainLength)
    })
  }
  for (const { results, params } of res) {
    console.log(`params - ${params.txCount}/${params.blockchainLength.toExponential()}   lookups - network: ${results.networkReads}   total: ${results.totalReads}`)
  }
})()
  .catch(err => {
    console.error(err.stack)
    process.exit(1)
  })

async function performTest (txCount, blockchainLength) {
  // create txs
  const txs = fillArray(txCount, function () {
    return Math.floor(Math.random() * blockchainLength)
  }).sort()

  async function lookupNonce (blockNumber) {
    const nonceCount = txs.filter(function (tx) { return tx <= blockNumber }).length
    // console.log(`(${reads}): ${blockNumber} -> ${nonceCount}`)
    return nonceCount
  }

  let totalReads = 0
  let networkReads = 0
  const dataLookup = memoize(lookupNonce, function () { totalReads++ }, function () { totalReads++; networkReads++ })

  await findIncrements(0, blockchainLength - 1, dataLookup)

  return {
    networkReads: networkReads,
    totalReads: totalReads
  }
}

// util

function fillArray (num, fn) {
  return Array(num).join(',').split(',').map(fn)
}

function memoize (fn, cacheHit, cacheMiss) {
  const cache = {}
  return async function (index) {
    // try cache
    let result = cache[index]
    if (result === undefined) {
      // fallback to request
      cacheMiss()
      result = await fn(index)
      cache[index] = result
    } else {
      cacheHit()
    }
    return result
  }
}

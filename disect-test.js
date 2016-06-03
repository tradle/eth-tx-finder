const async = require('async')
const findIncrements = require('./disect')

var testParams = [
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
  { txCount: 100, blockchainLength: 2e6 },
]

var testWork = testParams.map(function(params){
  return  performTest.bind(null, params.txCount, params.blockchainLength)
})

async.series(testWork, function(err, allResults){
  if (err) throw err
  allResults.map(function(results, index){
    var params = testParams[index]
    console.log(`params - ${params.txCount}/${params.blockchainLength.toExponential()}   lookups - network: ${results.networkReads}   total: ${results.totalReads}`)
  })
})

function performTest(txCount, blockchainLength, cb){

  // create txs
  var txs = fillArray(txCount, function(){
    return Math.floor(Math.random() * blockchainLength)
  }).sort()

  function lookupNonce(blockNumber, cb){
    var nonceCount = txs.filter(function(tx){ return tx <= blockNumber }).length
    // console.log(`(${reads}): ${blockNumber} -> ${nonceCount}`)
    cb(null, nonceCount)
  }

  var totalReads = 0
  var networkReads = 0
  var dataLookup = memoize(lookupNonce, function(){ totalReads++ }, function(){ totalReads++; networkReads++ })

  findIncrements(0, blockchainLength-1, dataLookup, function(err, matches){
    if (err) return cb(err)
    var results = {
      networkReads: networkReads,
      totalReads: totalReads,
      // blocks: matches,
    }
    cb(null, results)
  })

}

// util

function fillArray(num, fn){
  return Array(num).join(',').split(',').map(fn)
}

function memoize(fn, cacheHit, cacheMiss){
  var cache = {}
  return function(index, cb){
    // try cache
    var cachedResult = cache[index]
    if (cachedResult !== undefined) {
      cacheHit()
      return cb(null, cachedResult)
    }
    // fallback to request
    fn(index, function(err, result){
      if (err) return cb(err)
      cache[index] = result
      cacheMiss()
      return cb(null, result)
    })
  }
}
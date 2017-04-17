const EthQuery = require('eth-store/query')
const async = require('async')
const findIncrements = require('./disect.js')
const MAX_CONCURRENT = 5

module.exports = {
  findAllTxs,
  findAllTxsInRange,
  findAllTxsTo,
  findAllTxsInRangeTo,
}

function rangeToArray (min, max) {
  var arr = []
  for (var i = min; i <= max; i++) {
    arr.push(i)
  }

  return arr
}

function flatten (arr) {
  return arr.reduce(function (all, some) {
    return all.concat(some)
  }, [])
}

function findAllTxsTo(provider, targetAddress, onTx, onComplete) {
  var query = new EthQuery(provider)
  query.getLatestBlockNumber(function(err, blockNumberHex){
    if (err) return onComplete(err)
    var blockNumber = parseInt(blockNumberHex, 16)
    findAllTxsInRangeTo(provider, targetAddress, 0, blockNumber, onTx, onComplete)
  })
}

function findAllTxsInRangeTo(provider, targetAddress, minBlockNumber, maxBlockNumber, onTx, onComplete) {
  var query = new EthQuery(provider)
  query.getLatestBlockNumber(function(err, blockNumberHex){
    if (err) return onComplete(err)
    var blockNumber = parseInt(blockNumberHex, 16)
    async.mapLimit(rangeToArray(minBlockNumber, maxBlockNumber), MAX_CONCURRENT, function (blockNumber, cb) {
      query.getBlockByNumber(blockNumber, function(err, block){
        if (err) return onComplete(err)
        var matchingTxs = block.transactions.filter(tx => tx.to === targetAddress)
        matchingTxs.forEach(onTx)
        cb(null, matchingTxs)
      })
    }, function (err, results) {
      if (err) return onComplete(err)

      onComplete(null, flatten(results))
    })
  })
}

function findAllTxs(provider, targetAddress, onTx, onComplete){
  var query = new EthQuery(provider)
  query.getLatestBlockNumber(function(err, blockNumberHex){
    if (err) return onComplete(err)
    var blockNumber = parseInt(blockNumberHex, 16)
    findAllTxsInRange(provider, targetAddress, 0, blockNumber, onTx, onComplete)
  })
}

function findAllTxsInRange(provider, targetAddress, minBlockNumber, maxBlockNumber, onTx, onComplete){

  var query = new EthQuery(provider)
  var nonceLookup = memoize(query.getNonce.bind(query, targetAddress))
  var results = []
  var blockProcessingQueue = async.queue(searchBlockForTxs)
  var onBlockFound = blockProcessingQueue.push.bind(blockProcessingQueue)

  findIncrements(minBlockNumber, maxBlockNumber, nonceLookup, onBlockFound, onAllBlocksFound)

  function searchBlockForTxs(blockNumber, cb){
    query.getBlockByNumber(blockNumber, function(err, block){
      if (err) return onComplete(err)
      var matchingTxs = block.transactions.filter(tx => tx.from === targetAddress)
      results = results.concat(matchingTxs)
      matchingTxs.forEach(onTx)
      cb()
    })
  }

  function onAllBlocksFound(err, matches){
    if (err) return onComplete(err)
    // wait for queue idle/drain
    blockProcessingQueue.idle() ? returnResults() : blockProcessingQueue.drain = returnResults
  }

  function returnResults(){
    // sort by blockNumber, ascending
    results = results.sort((txA, txB) => txA.blockNumber < txA.blockNumber)
    onComplete(null, results)
  }

}


// util

function memoize(fn, cacheHit, cacheMiss){
  cacheHit = cacheHit || noop
  cacheMiss = cacheMiss || noop
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

function noop(){}

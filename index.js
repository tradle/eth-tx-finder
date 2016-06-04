const EthQuery = require('eth-store/query')
const async = require('async')
const findIncrements = require('./disect.js')

module.exports = {
  findAllTxs,
  findAllTxsInRange,
}


function findAllTxs(provider, targetAddress, onTx, onComplete){
  var query = new EthQuery(provider)
  query.getLatestBlockNumber(function(err, blockNumberHex){
    if (err) return onComplete(err)
    var blockNumber = parseInt(blockNumberHex, 16)
    findAllTxsInRange(provider, targetAddress, 0, blockNumber-1, onTx, onComplete)
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

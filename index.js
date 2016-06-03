const disect = require('disect')
const curlify = require('request-as-curl')
const xhr = process.browser ? require('xhr') : require('request')
// const RPC_ENDPOINT = 'https://rawtestrpc.metamask.io/'
// const RPC_ENDPOINT = 'http://localhost:8545/'
const RPC_ENDPOINT = 'https://morden.infura.io/'

var requests = 0


findFirstTx('0x2a65aca4d5fc5b5c859090a6c34d164135398226', function(err, results){
  if (err) throw err
  var firstTx = results[0]
  console.log('========================')
  console.log('first tx:', firstTx)
  console.log('total requests made:', requests)
})

function findFirstTx(address, cb){
  getLatestBlockNumber(function(err, lastBlock){
    if (err) return cb(err)
    var firstBlock = 0
    findNonce(address, 1, firstBlock, lastBlock, function(err, blockNumber){
      if (err) return cb(err)
      getTxsForUserInBlock(address, blockNumber, cb)
    })
  })
}

function getTxsForUserInBlock(address, blockNumber, cb){
  getBlockByTag(blockNumber, function(err, block){
    if (err) return cb(err)
    var result = block.transactions.filter(function(tx){
      return tx.from === address
    })
    cb(null, result)
  })
}

function findNonce(address, target, start, end, cb){
  disect(start, end, function (blockNumber, cb) {
    console.log('trying block:', blockNumber)
    getNonce(address, blockNumber, function(err, nonce){
      if (err) return console.error('died on block #'+blockNumber)
      cb(nonce >= target)
    })
  }, function (result) {
    cb(null, result)
  })
}

function getLatestBlockNumber(cb){
  getBlockByTag('latest', function(err, result){
    if (err) return cb(err)
    cb(null, parseInt(result.number))
  })
}

function getBlockByTag(blockTag, cb){
  performRpc({
    method: 'eth_getBlockByNumber',
    params: [
      blockTag,
      true,
    ],
  }, cb)
}

function getNonce(address, block, cb){
  performRpc({
    method: 'eth_getTransactionCount',
    params: [
      address,
      '0x'+block.toString(16),
    ],
  }, function(err, result){
    if (err) return cb(err)
    cb(null, parseInt(result))
  })
}

function performRpc(payload, cb){
  requests++
  var requestParams = {
    uri: RPC_ENDPOINT,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    rejectUnauthorized: false,
  }
  
  var req = xhr(requestParams, function(err, res, body) {
    if (err) return cb(err)

    // log the request
    // var deberg = curlify(req.req, payload)
    // console.log(deberg)

    // parse response
    var data
    try {
      data = JSON.parse(body)
      if (data.error) return cb(data.error)
    } catch (err) {
      // console.error(RPC_ENDPOINT)
      // console.error(body)
      // console.error(err.stack)
      return cb(err)
    }
    
    // console.log('network:', payload.method, payload.params, '->', data.result)
    cb(null, data.result)
  })
}

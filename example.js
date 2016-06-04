const async = require('async')
const xhr = process.browser ? require('xhr') : require('request')
const EthQuery = require('eth-store/query')
const findAllTxsInRange = require('./index.js').findAllTxsInRange

const RPC_ENDPOINT = 'https://mainnet.infura.io/'
const targetAccount = '0x6aaa5f611b08f8ae98d377ba3f09b1717822b322'
// const targetAccount = '0x7773dc77b66d96ee4c2f72cdc402349366c7b11d'

var provider = {
  sendAsync: function(payload, cb){
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
      cb(null, data)
    })
  }
}

var startBlock = 0
var endBlock = 1622266

var query = new EthQuery(provider)
async.parallel({
  earliest: query.getNonce.bind(query, targetAccount, startBlock),
  latest:   query.getNonce.bind(query, targetAccount, endBlock),
}, function(err, results){
  if (err) throw err
  
  var totalTxCount = hexToNumber(results.latest) - hexToNumber(results.earliest)
  var foundTxCount = 0
  
  console.log(`searching for all txs for ${targetAccount}`)
  findAllTxsInRange(provider, targetAccount, startBlock, endBlock, onTx, onComplete)

  function onTx(txData){
    foundTxCount++
    console.log(`found: ${foundTxCount}/${totalTxCount} = ${100*foundTxCount/totalTxCount}%`)
  }

  function onComplete(err, results){
    if (err) throw err
    console.log('results:', results.map(tx=>tx.hash))
  }

})


// util

function hexToNumber(hexString){
  return parseInt(hexString, 16)
}
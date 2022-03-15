const debug = require('debug')('example')
if (!debug.enabled) {
  console.log('[NOTE] this may take a while, with DEBUG=* you can figure out what is happening.\n---')
}

const RPC_ENDPOINT = 'http://127.0.0.1:3334'
const targetAccount = '0x6aaa5f611b08f8ae98d377ba3f09b1717822b322'

console.log(`Looking for transactions for ${targetAccount} using RPC endpoint: ${RPC_ENDPOINT}\n---`)

const { fetch } = require('cross-fetch')
const EthQuery = require('@tradle/eth-store/query')

const { findAllTxsInRange } = require('./index.js')

async function sendPromise (payload) {
  const body = JSON.stringify(payload)
  const requestParams = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body,
    rejectUnauthorized: false
  }

  debug('Fetching request', requestParams)

  try {
    const res = await fetch(RPC_ENDPOINT, requestParams)
    const data = await res.json()

    if (data.error) {
      let hint = ''
      if (data.error.code === -32000) {
        if (/no suitable peers available/.test(data.error.message)) {
          hint = '\n\n[HINT]: it looks like your local node is still starting, give it some time!\n'
        }
      }
      throw new Error(`Error from rpc: ${JSON.stringify(data.error)} for ${body}${hint}`)
    }
    return data
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      debug(err)
      console.log('\n\n[ERROR] Can not find a local geth node. Maybe you need to start one?!\nRecommended mode:\n$ geth --http --http.port 3334 --cache.noprefetch --syncmode light')
      process.exit(1)
    }
    throw err
  }
}

const provider = {
  sendPromise
}

;(async () => {
  const startBlock = 0
  const endBlock = 12084861

  const query = new EthQuery(provider)
  const [earliest, latest] = await Promise.all([
    query.getNonce(targetAccount, startBlock),
    query.getNonce(targetAccount, endBlock)
  ])

  debug('earliest/latest', earliest, latest)

  const totalTxCount = hexToNumber(latest) - hexToNumber(earliest)
  let foundTxCount = 0

  debug(`searching for all txs for targetAccount=${targetAccount}, totalTxCount=${totalTxCount}, foundTxCount=${foundTxCount}`)

  const results = await findAllTxsInRange(provider, targetAccount, startBlock, endBlock, onTx)

  console.log(results)

  function onTx (txData) {
    foundTxCount++
    console.log(`found (${txData.blockHash}): ${foundTxCount}/${totalTxCount} = ${100 * foundTxCount / totalTxCount}%`)
  }
})()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

// util
function hexToNumber (hexString) {
  return parseInt(hexString, 16)
}

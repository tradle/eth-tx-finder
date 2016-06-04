### Ethereum RPC backed sender->txs lookup

Status: Experimental

### live internet statistics

search is in series as parallel is causing problems...

2 txs in 1.6 mil blocks
```
searching for all txs for 0x6aaa5f611b08f8ae98d377ba3f09b1717822b322
8.746s total
```

50 txs in 1.6 mil blocks
```
searching for all txs for 0x7773dc77b66d96ee4c2f72cdc402349366c7b11d
2m55s total
```

### initial statistics
```
params - txCount/blockchainLength   lookups - network requests   total requests including cache hits

params - 1/2e+6     lookups - network:   23   total:   24
params - 1/2e+6     lookups - network:   23   total:   24
params - 1/2e+6     lookups - network:   23   total:   24

params - 2/2e+6     lookups - network:   42   total:   50
params - 2/2e+6     lookups - network:   43   total:   48
params - 2/2e+6     lookups - network:   43   total:   48

params - 10/2e+6    lookups - network:  182   total:  231
params - 10/2e+6    lookups - network:  175   total:  221
params - 10/2e+6    lookups - network:  182   total:  228

params - 20/2e+6    lookups - network:  335   total:  421
params - 20/2e+6    lookups - network:  327   total:  431
params - 20/2e+6    lookups - network:  337   total:  441

params - 50/2e+6    lookups - network:  780   total: 1034
params - 50/2e+6    lookups - network:  768   total: 1034
params - 50/2e+6    lookups - network:  772   total: 1035

params - 100/2e+6   lookups - network: 1450   total: 1967
params - 100/2e+6   lookups - network: 1418   total: 2025
params - 100/2e+6   lookups - network: 1440   total: 1996
```
### Ethereum RPC backed sender->txs lookup

[![Greenkeeper badge](https://badges.greenkeeper.io/kumavis/eth-tx-finder.svg)](https://greenkeeper.io/)

Status: Experimental

note: search is in series as parallel is causing problems...

### live internet statistics

be warned, this is really heavy weight on network I/O

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
| txCount | blockchain length  | requests incl cache |  network requests |
| --- | ----------- | ---- | ---- |
|  1 | 2 million   |   24 |   23 |
|  1 | 2 million   |   24 |   23 |
|  1 | 2 million   |   24 |   23 |
|  2 | 2 million   |   50 |   42 |
|  2 | 2 million   |   48 |   43 |
|  2 | 2 million   |   48 |   43 |
|  10 | 2 million  |  231 |  182 |
|  10 | 2 million  |  221 |  175 |
|  10 | 2 million  |  228 |  182 |
|  20 | 2 million  |  421 |  335 |
|  20 | 2 million  |  431 |  327 |
|  20 | 2 million  |  441 |  337 |
|  50 | 2 million  | 1034 |  780 |
|  50 | 2 million  | 1034 |  768 |
|  50 | 2 million  | 1035 |  772 |
| 100 | 2 million | 1967 | 1450 |
| 100 | 2 million | 2025 | 1418 |
| 100 | 2 million | 1996 | 1440 |

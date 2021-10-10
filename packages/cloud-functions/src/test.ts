import ExchangeRateManager from './exchangeRate/ExchangeRateManager'
import FirebasePriceUpdater from './exchangeRate/FirebasePriceUpdater'
import { moolaExchanges } from './exchangeRate/sources/MoolaExchanges'
import { ubeswapLiquidityPool } from './exchangeRate/sources/UbeswapLiquidityPool'

// const graph = new ExchangesGraph()
// graph.addExchange({ from: 'test1', to: 'test2', rate: 1.2 })
// graph.addExchange({ from: 'test2', to: 'test1', rate: 0.8 })

// graph.addExchange({ from: 'test2', to: 'test3', rate: 1.2 })
// graph.addExchange({ from: 'test3', to: 'test2', rate: 0.75 })

// graph.addExchange({ from: 'test1', to: 'test3', rate: 1.7 })
// graph.addExchange({ from: 'test3', to: 'test1', rate: 0.55 })

// graph.addExchange({ from: 'test2', to: 'test4', rate: 0.7 })
// graph.addExchange({ from: 'test4', to: 'test2', rate: 1.4 })

// console.log(`${JSON.stringify(graph.getAllExchanges())}`)

// const cUSD = "0x765de816845861e75a25fca122bb6898b8b1282a"
// const cEUR = "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73"
// const CELO = "0x471EcE3750Da237f93B8E339c536989b8978a438"
// const mcUSD = "0x64defa3544c695db8c535d289d843a189aa26b98"

// ubeswapLiquidityPool.getInfoFromToken([cEUR, cUSD, CELO, mcUSD])
//   .then(res => console.log(res))

const updater = new FirebasePriceUpdater(
  new ExchangeRateManager([ubeswapLiquidityPool, moolaExchanges])
)
updater.refreshAllPrices().then((res) => console.log('Refreshed tokens'))

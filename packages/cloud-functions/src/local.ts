import { updatePrices } from './exchangeRate/PriceUpdater'

updatePrices().then(() => console.log('FINISHED'))

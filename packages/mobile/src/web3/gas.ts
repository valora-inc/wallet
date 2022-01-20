import BigNumber from 'bignumber.js'
import { GAS_PRICE_INFLATION_FACTOR } from 'src/config'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'

const TAG = 'web3/gas'
const GAS_PRICE_STALE_AFTER = 150000 // 15 seconds

const gasPrice: { [feeCurrency: string]: BigNumber | undefined } = {}
const gasPriceLastUpdated: { [feeCurrency: string]: number | undefined } = {}

export async function getGasPrice(feeCurrency: string | undefined): Promise<BigNumber> {
  Logger.debug(`${TAG}/getGasPrice`, 'Getting gas price')

  const currencyKey = feeCurrency ?? 'CELO'
  try {
    if (
      gasPrice[currencyKey] === undefined ||
      gasPriceLastUpdated[currencyKey] === undefined ||
      Date.now() - gasPriceLastUpdated[currencyKey]! >= GAS_PRICE_STALE_AFTER
    ) {
      gasPrice[currencyKey] = await fetchGasPrice(feeCurrency)
      gasPriceLastUpdated[currencyKey] = Date.now()
    }
    return gasPrice[currencyKey]!
  } catch (error) {
    Logger.error(`${TAG}/getGasPrice`, 'Could not fetch and update gas price.', error)
    throw new Error('Error fetching gas price')
  }
}

async function fetchGasPrice(feeCurrency: string | undefined): Promise<BigNumber> {
  const contractKit = await getContractKitAsync()
  const gasPriceMinimum = await contractKit.contracts.getGasPriceMinimum()
  // @ts-ignore
  const latestGasPrice = await gasPriceMinimum.getGasPriceMinimum(feeCurrency)
  const inflatedGasPrice = latestGasPrice.times(GAS_PRICE_INFLATION_FACTOR)
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Result price in ${feeCurrency} with inflation: ${inflatedGasPrice.toString()}`
  )
  return inflatedGasPrice
}

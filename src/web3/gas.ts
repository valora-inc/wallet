import BigNumber from 'bignumber.js'
import { GAS_PRICE_INFLATION_FACTOR } from 'src/config'
import { store } from 'src/redux/store'
import { celoAddressSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'

const TAG = 'web3/gas'
const GAS_PRICE_STALE_AFTER = 150000 // 15 seconds

const gasPrice: { [feeCurrency: string]: BigNumber | undefined } = {}
const gasPriceLastUpdated: { [feeCurrency: string]: number | undefined } = {}

export async function getGasPrice(feeCurrency: string | undefined): Promise<BigNumber> {
  Logger.debug(`${TAG}/getGasPrice`, 'Getting gas price')
  const celoAddress = celoAddressSelector(store.getState())
  const tokenAddress = feeCurrency ?? celoAddress ?? ''

  try {
    if (
      gasPrice[tokenAddress] === undefined ||
      gasPriceLastUpdated[tokenAddress] === undefined ||
      Date.now() - gasPriceLastUpdated[tokenAddress]! >= GAS_PRICE_STALE_AFTER
    ) {
      gasPrice[tokenAddress] = await fetchGasPrice(tokenAddress)
      gasPriceLastUpdated[tokenAddress] = Date.now()
    }
    return gasPrice[tokenAddress]!
  } catch (error) {
    Logger.error(`${TAG}/getGasPrice`, 'Could not fetch and update gas price.', error)
    throw new Error('Error fetching gas price')
  }
}

async function fetchGasPrice(tokenAddress: string): Promise<BigNumber> {
  const contractKit = await getContractKitAsync()
  const gasPriceMinimum = await contractKit.contracts.getGasPriceMinimum()
  const latestGasPrice = await gasPriceMinimum.getGasPriceMinimum(tokenAddress)
  const inflatedGasPrice = latestGasPrice.times(GAS_PRICE_INFLATION_FACTOR)
  Logger.debug(
    TAG,
    'fetchGasPrice',
    `Result price in ${tokenAddress} with inflation: ${inflatedGasPrice.toString()}`
  )
  return inflatedGasPrice
}

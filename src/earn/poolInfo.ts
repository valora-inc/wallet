import BigNumber from 'bignumber.js'
import AavePool from 'src/abis/AavePoolV3'
import { Network } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { publicClient } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'
import { Address } from 'viem'

const TAG = 'earn/poolInfo'

const COMPOUND_PERIOD = 365 * 24 * 60 * 60 // 1 year in seconds

export async function fetchAavePoolInfo(assetAddress: Address) {
  try {
    Logger.debug(TAG, 'Fetching Aave pool info for asset', assetAddress)
    const result = await publicClient[Network.Arbitrum].readContract({
      abi: AavePool,
      address: networkConfig.arbAavePoolV3ContractAddress,
      functionName: 'getReserveData',
      args: [assetAddress],
    })

    // The chain data is in RAY units (1e27) and non compounded
    // https://docs.aave.com/developers/guides/rates-guide#formatting-rates
    const apr = new BigNumber(result.currentLiquidityRate.toString()).div(1e27).toNumber()
    const apy = (1 + apr / COMPOUND_PERIOD) ** COMPOUND_PERIOD - 1
    return { apy }
  } catch (error) {
    const err = ensureError(error)
    Logger.error(TAG, 'Failed to fetch Aave pool info', err)
    throw err
  }
}

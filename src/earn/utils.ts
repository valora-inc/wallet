import BigNumber from 'bignumber.js'
import { EarnPosition } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { SwapTransaction } from 'src/swap/types'
import { Network, NetworkId } from 'src/transactions/types'
import { INTERNAL_RPC_SUPPORTED_NETWORKS } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'

/**
 * Helper function to check if gas is subsidized for the given networkId
 * @param networkId - networkId to check
 * @returns boolean
 */
export function isGasSubsidizedForNetwork(networkId: NetworkId) {
  return (
    (INTERNAL_RPC_SUPPORTED_NETWORKS as readonly Network[]).includes(
      networkIdToNetwork[networkId]
    ) && getFeatureGate(StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)
  )
}

/**
 * Gets the swap to amount in decimals given a swap transaction and the swap
 * from amount in decimals. This could also be taken from the buy amount, but
 * that is in wei and we would need the token decimals. This follows what is
 * done in the SwapScreen
 * @param object.swapTransaction - swap transaction object
 * @param object.fromAmount - swap from amount in decimals (usually from the user input)
 * @returns swap to amount in decimals
 */
export function getSwapToAmountInDecimals({
  swapTransaction,
  fromAmount,
}: {
  swapTransaction: SwapTransaction
  fromAmount: BigNumber
}) {
  return fromAmount.multipliedBy(swapTransaction.price)
}

export function getTotalYieldRate(pool: EarnPosition) {
  return new BigNumber(
    pool.dataProps.yieldRates.reduce((acc, yieldRate) => acc + yieldRate.percentage, 0)
  )
}

export function getEarnPositionBalanceValues({ pool }: { pool: EarnPosition }) {
  const poolBalanceInUsd = new BigNumber(pool.balance).multipliedBy(pool.priceUsd)
  const poolBalanceInDepositToken = new BigNumber(pool.balance).multipliedBy(
    pool.pricePerShare[0] ?? 1
  )
  return { poolBalanceInUsd, poolBalanceInDepositToken }
}

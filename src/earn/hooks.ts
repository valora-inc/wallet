import { useMemo } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import {
  prepareClaimTransactions,
  prepareDepositTransactions,
  prepareWithdrawAndClaimTransactions,
  prepareWithdrawTransactions,
  prepareWithdrawTransactionsWithSwap,
} from 'src/earn/prepareTransactions'
import { EarnActiveMode } from 'src/earn/types'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { earnPositionsSelector } from 'src/positions/selectors'
import { EarnPosition, Position } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { useCashInTokens, useSwappableTokens } from 'src/tokens/hooks'
import { TokenBalance, TokenBalances } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { Address } from 'viem'

const TAG = 'earn/hooks'

export function useEarnPositionProviderName(providerId: string) {
  const pools = useSelector(earnPositionsSelector)
  const providerName = pools.find((pool) => pool.appId === providerId)?.appName
  if (!providerName) {
    Logger.warn(TAG, 'providerName not found', providerId)
  }
  return providerName
}

export function useDepositEntrypointInfo({
  allTokens,
  pool,
}: {
  allTokens: TokenBalances
  pool: EarnPosition
}) {
  const { networkId, tokenId: poolTokenId, dataProps } = pool

  const { swappableFromTokens } = useSwappableTokens()
  const cashInTokens = useCashInTokens()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const userLocation = useSelector(userLocationDataSelector)

  const hasDepositToken = useMemo(() => {
    return allTokens[dataProps.depositTokenId]?.balance?.gt(0) ?? false
  }, [pool, allTokens])
  const hasTokensOnSameNetwork = useMemo(() => {
    return (
      isSwapEnabled &&
      !!swappableFromTokens.find(
        (tokenInfo) =>
          tokenInfo.networkId === networkId &&
          tokenInfo.tokenId !== dataProps.depositTokenId &&
          tokenInfo.tokenId !== poolTokenId &&
          tokenInfo.balance?.gt(0)
      )
    )
  }, [pool, isSwapEnabled, swappableFromTokens])
  const hasTokensOnOtherNetworks = useMemo(() => {
    return (
      getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS) &&
      isSwapEnabled &&
      !!swappableFromTokens.find(
        (tokenInfo) => tokenInfo.networkId !== networkId && tokenInfo.balance?.gt(0)
      )
    )
  }, [pool, isSwapEnabled, swappableFromTokens])
  const canCashIn = useMemo(() => {
    return !!cashInTokens.find((tokenInfo) => tokenInfo.tokenId === dataProps.depositTokenId)
  }, [pool, cashInTokens])

  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(
        userLocation.countryCodeAlpha2,
        dataProps.depositTokenId
      )

      return availableExchanges
    } catch (error) {
      return []
    }
  }, [])
  const exchanges = useMemo(() => {
    return asyncExchanges.result ?? []
  }, [asyncExchanges.result])
  return { hasDepositToken, hasTokensOnSameNetwork, hasTokensOnOtherNetworks, canCashIn, exchanges }
}

// Used on EarnEnterAmount.tsx with on user input with a debounced callback
export function usePrepareEnterAmountTransactionsCallback(
  mode: Extract<EarnActiveMode, 'deposit' | 'withdraw' | 'swap-deposit'>
) {
  const prepareTransactions = useAsyncCallback(
    async (args) => {
      return mode === 'withdraw'
        ? prepareWithdrawTransactionsWithSwap(args)
        : prepareDepositTransactions(args)
    },
    {
      onError: (err) => {
        const error = ensureError(err)
        Logger.error(TAG, 'usePrepareEnterAmountTransactions - Error:', error)
      },
    }
  )

  return {
    prepareTransactionsResult: prepareTransactions.result,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: prepareTransactions.reset,
    prepareTransactionError: prepareTransactions.error,
    isPreparingTransactions: prepareTransactions.loading,
  }
}

// Used on the EarnConfirmationScreen.tsx called once on load
export function usePrepareEarnConfirmationScreenTransactions(
  mode: Extract<EarnActiveMode, 'claim-rewards' | 'exit' | 'withdraw'>,
  params: {
    pool: EarnPosition
    walletAddress: Address
    feeCurrencies: TokenBalance[]
    hooksApiUrl: string
    amount: string
    useMax: boolean
    rewardsPositions: Position[]
  }
) {
  return useAsync(
    async () =>
      mode === 'claim-rewards'
        ? await prepareClaimTransactions(params)
        : mode === 'exit'
          ? await prepareWithdrawAndClaimTransactions(params)
          : await prepareWithdrawTransactions(params),
    [],
    {
      onError: (err) => {
        const error = ensureError(err)
        Logger.error(TAG, 'usePrepareEarnConfirmationScreenTransactions', error)
      },
    }
  )
}

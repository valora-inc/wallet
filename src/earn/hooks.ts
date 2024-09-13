import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import { BeforeDepositAction, BeforeDepositActionName } from 'src/earn/EarnPoolInfoScreen'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { PrepareWithdrawAndClaimParams } from 'src/earn/types'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { CICOFlow, fetchExchanges } from 'src/fiatExchanges/utils'
import SwapAndDeposit from 'src/icons/SwapAndDeposit'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { earnPositionsSelector } from 'src/positions/selectors'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { useCashInTokens, useSwappableTokens } from 'src/tokens/hooks'
import { TokenBalance, TokenBalances } from 'src/tokens/slice'
import { getTokenAnalyticsProps } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'earn/hooks'

export function usePrepareWithdrawAndClaimTransactions(params: PrepareWithdrawAndClaimParams) {
  return useAsync(() => prepareWithdrawAndClaimTransactions(params), [], {
    onError: (err) => {
      const error = ensureError(err)
      Logger.error(TAG, 'usePrepareWithdrawAndClaimTransactions', error)
    },
  })
}

export function useEarnPositionProviderName(providerId: string) {
  const pools = useSelector(earnPositionsSelector)
  const providerName = pools.find((pool) => pool.appId === providerId)?.appName
  if (!providerName) {
    Logger.warn(TAG, 'providerName not found', providerId)
  }
  return providerName
}

// Helper hook to get position given a positionId. Defaults to the aave position
// while we're in the interim period of building the multiple pool flow
export function useEarnPosition(positionId: string = networkConfig.aaveArbUsdcTokenId) {
  const pools = useSelector(earnPositionsSelector)
  return useMemo(() => {
    const pool = pools.find((pool) => pool.positionId === positionId)
    if (!pool) {
      Logger.warn(TAG, 'pool not found', positionId)
    }
    return pool
  }, [pools, positionId])
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

export function useAddAction({
  token,
  forwardedRef,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}): BeforeDepositAction {
  const { t } = useTranslation()

  return {
    name: BeforeDepositActionName.Add,
    title: t('addFundsActions.add'),
    details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.add', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsAdd,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
        action: BeforeDepositActionName.Add,
        ...getTokenAnalyticsProps(token),
      })

      navigate(Screens.FiatExchangeAmount, {
        tokenId: token.tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: token.symbol,
      })
      forwardedRef.current?.close()
    },
  }
}

export function useTransferAction({
  token,
  exchanges,
  forwardedRef,
}: {
  token: TokenBalance
  exchanges: ExternalExchangeProvider[]
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}): BeforeDepositAction {
  const { t } = useTranslation()

  return {
    name: BeforeDepositActionName.Transfer,
    title: t('addFundsActions.add'),
    details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.transfer', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsSend,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
        action: BeforeDepositActionName.Transfer,
        ...getTokenAnalyticsProps(token),
      })

      navigate(Screens.ExchangeQR, { flow: CICOFlow.CashIn, exchanges })
      forwardedRef.current?.close()
    },
  }
}

export function useCrossChainSwapAction({
  token,
  title,
  details,
  forwardedRef,
}: {
  token: TokenBalance
  title: string
  details: string
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}): BeforeDepositAction {
  return {
    name: BeforeDepositActionName.CrossChainSwap,
    title,
    details,
    iconComponent: QuickActionsSwap,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
        action: BeforeDepositActionName.CrossChainSwap,
        ...getTokenAnalyticsProps(token),
      })

      navigate(Screens.SwapScreenWithBack, { toTokenId: token.tokenId })
      forwardedRef.current?.close()
    },
  }
}

export function useSwapAndDepositAction({
  token,
  forwardedRef,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}): BeforeDepositAction {
  const { t } = useTranslation()

  return {
    name: BeforeDepositActionName.SwapAndDeposit,
    title: t('earnFlow.poolInfoScreen.beforeDepositBottomSheet.action.swapAndDeposit'),
    details: t('earnFlow.poolInfoScreen.beforeDepositBottomSheet.swapAndDepositActionDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: SwapAndDeposit,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
        action: BeforeDepositActionName.SwapAndDeposit,
        ...getTokenAnalyticsProps(token),
      })

      // TODO: navigate to swap and deposit screen after ACT-1356
      forwardedRef.current?.close()
    },
  }
}

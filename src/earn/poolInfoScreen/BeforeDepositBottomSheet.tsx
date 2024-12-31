import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { EarnCommonProperties, TokenProperties } from 'src/analytics/Properties'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import { ActionCard } from 'src/earn/ActionCard'
import { BeforeDepositAction } from 'src/earn/types'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { CICOFlow } from 'src/fiatExchanges/types'
import EarnCoins from 'src/icons/EarnCoins'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import SwapAndDeposit from 'src/icons/SwapAndDeposit'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

function AddAction({
  token,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'Add',
    title: t('earnFlow.beforeDepositBottomSheet.action.add'),
    details: t('earnFlow.beforeDepositBottomSheet.action.addDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsAdd,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'Add',
        ...analyticsProps,
      })

      navigate(Screens.FiatExchangeAmount, {
        tokenId: token.tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: token.symbol,
      })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function AddMoreAction({
  token,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'AddMore',
    title: t('earnFlow.beforeDepositBottomSheet.action.addMore', { tokenSymbol: token.symbol }),
    details: t('earnFlow.beforeDepositBottomSheet.action.addDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsAdd,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'AddMore',
        ...analyticsProps,
      })

      navigate(Screens.FiatExchangeAmount, {
        tokenId: token.tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: token.symbol,
      })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function TransferAction({
  token,
  exchanges,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  exchanges: ExternalExchangeProvider[]
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'Transfer',
    title: t('earnFlow.beforeDepositBottomSheet.action.transfer'),
    details: t('earnFlow.beforeDepositBottomSheet.action.transferDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsSend,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'Transfer',
        ...analyticsProps,
      })

      navigate(Screens.ExchangeQR, { flow: CICOFlow.CashIn, exchanges })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function CrossChainSwapAction({
  token,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'CrossChainSwap',
    title: t('earnFlow.beforeDepositBottomSheet.action.crossChainSwap'),
    details: t('earnFlow.beforeDepositBottomSheet.action.crossChainSwapDescription', {
      tokenSymbol: token.symbol,
    }),
    iconComponent: SwapArrows,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'CrossChainSwap',
        ...analyticsProps,
      })

      navigate(Screens.SwapScreenWithBack, { toTokenId: token.tokenId })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function SwapAction({
  token,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'Swap',
    title: t('earnFlow.beforeDepositBottomSheet.action.swap'),
    details: t('earnFlow.beforeDepositBottomSheet.action.swapDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: SwapArrows,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'Swap',
        ...analyticsProps,
      })

      navigate(Screens.SwapScreenWithBack, { toTokenId: token.tokenId })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function SwapAndDepositAction({
  token,
  pool,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  pool: EarnPosition
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'SwapAndDeposit',
    title: t('earnFlow.beforeDepositBottomSheet.action.swapAndDeposit'),
    details: t('earnFlow.beforeDepositBottomSheet.action.swapAndDepositDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: SwapAndDeposit,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'SwapAndDeposit',
        ...analyticsProps,
      })

      navigate(Screens.EarnEnterAmount, { pool, mode: 'swap-deposit' })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function DepositAction({
  token,
  pool,
  forwardedRef,
  analyticsProps,
}: {
  token: TokenBalance
  pool: EarnPosition
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  analyticsProps: EarnCommonProperties & TokenProperties
}) {
  const { t } = useTranslation()

  const action: BeforeDepositAction = {
    name: 'Deposit',
    title: t('earnFlow.beforeDepositBottomSheet.action.deposit', { tokenSymbol: token.symbol }),
    details: t('earnFlow.beforeDepositBottomSheet.action.depositDescription', {
      amount: token.balance,
      tokenSymbol: token.symbol,
    }),
    iconComponent: EarnCoins,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: 'Deposit',
        ...analyticsProps,
      })

      navigate(Screens.EarnEnterAmount, { pool })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

export default function BeforeDepositBottomSheet({
  forwardedRef,
  token,
  pool,
  hasDepositToken,
  hasTokensOnSameNetwork,
  hasTokensOnOtherNetworks,
  canAdd,
  exchanges,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  token: TokenBalance
  pool: EarnPosition
  hasDepositToken: boolean
  hasTokensOnSameNetwork: boolean
  hasTokensOnOtherNetworks: boolean
  canAdd: boolean
  exchanges: ExternalExchangeProvider[]
}) {
  const { t } = useTranslation()

  const { availableShortcutIds } = pool
  const allowCrossChainSwaps = getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)
  const canCrossChainSwap = allowCrossChainSwaps && hasTokensOnOtherNetworks

  const canSwapDeposit = availableShortcutIds.includes('swap-deposit') && hasTokensOnSameNetwork

  const title =
    canSwapDeposit || hasDepositToken
      ? t('earnFlow.beforeDepositBottomSheet.depositTitle')
      : t('earnFlow.beforeDepositBottomSheet.beforeYouCanDepositTitle')

  const analyticsProps = {
    ...getTokenAnalyticsProps(token),
    poolId: pool.positionId,
    providerId: pool.appId,
    depositTokenId: pool.dataProps.depositTokenId,
  }

  const showCrossChainSwap = canSwapDeposit && canCrossChainSwap
  // Show a generic swap option if the pool doesn't support swap and deposit.
  const showSwap = !canSwapDeposit && (hasTokensOnSameNetwork || canCrossChainSwap)

  const hasAllDepositAndSwapOptions = hasDepositToken && hasTokensOnSameNetwork && canCrossChainSwap
  const hasNoDepositOrSwapOptions =
    !hasDepositToken && !hasTokensOnSameNetwork && !canCrossChainSwap

  const showAdd = canAdd && !hasDepositToken
  // Don't show add more if the user has all deposit and swap options are available
  const showAddMore = canAdd && hasDepositToken && !hasAllDepositAndSwapOptions
  // Show Transfer if the user cannot deposit or swap options or if the token
  // does not support buy and if not all deposit and swap options are available
  const showTransfer = hasNoDepositOrSwapOptions || (!canAdd && !hasAllDepositAndSwapOptions)

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={title}
      description={
        !canSwapDeposit && !hasDepositToken
          ? t('earnFlow.beforeDepositBottomSheet.beforeYouCanDepositDescriptionV1_101', {
              tokenSymbol: token.symbol,
              tokenNetwork: NETWORK_NAMES[token.networkId],
            })
          : undefined
      }
      titleStyle={styles.bottomSheetTitle}
      testId={'Earn/BeforeDepositBottomSheet'}
    >
      <View style={styles.actionsContainer}>
        {hasDepositToken && (
          <DepositAction
            token={token}
            pool={pool}
            forwardedRef={forwardedRef}
            analyticsProps={analyticsProps}
          />
        )}
        {canSwapDeposit && (
          <SwapAndDepositAction
            token={token}
            pool={pool}
            forwardedRef={forwardedRef}
            analyticsProps={analyticsProps}
          />
        )}
        {(canSwapDeposit || hasDepositToken) &&
          (showCrossChainSwap || showSwap || showAdd || showAddMore || showTransfer) && (
            <Text
              testID={'Earn/BeforeDepositBottomSheet/AlternativeDescription'}
              style={styles.actionDetails}
            >
              {t('earnFlow.beforeDepositBottomSheet.crossChainAlternativeDescription', {
                tokenNetwork: NETWORK_NAMES[token.networkId],
              })}
            </Text>
          )}
        {showCrossChainSwap && (
          <CrossChainSwapAction
            token={token}
            forwardedRef={forwardedRef}
            analyticsProps={analyticsProps}
          />
        )}
        {showSwap && (
          <SwapAction token={token} forwardedRef={forwardedRef} analyticsProps={analyticsProps} />
        )}
        {showAdd && (
          <AddAction token={token} forwardedRef={forwardedRef} analyticsProps={analyticsProps} />
        )}
        {showAddMore && (
          <AddMoreAction
            token={token}
            forwardedRef={forwardedRef}
            analyticsProps={analyticsProps}
          />
        )}
        {showTransfer && (
          <TransferAction
            token={token}
            exchanges={exchanges}
            forwardedRef={forwardedRef}
            analyticsProps={analyticsProps}
          />
        )}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  actionsContainer: {
    flex: 1,
    gap: Spacing.Regular16,
    marginVertical: Spacing.Thick24,
  },
  actionDetails: {
    ...typeScale.bodySmall,
    color: Colors.black,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
})

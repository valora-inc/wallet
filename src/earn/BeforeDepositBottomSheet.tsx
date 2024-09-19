import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { BeforeDepositAction, BeforeDepositActionName } from 'src/earn/types'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { CICOFlow } from 'src/fiatExchanges/utils'
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

function ActionCard({ action }: { action: BeforeDepositAction }) {
  return (
    <Touchable
      style={styles.touchable}
      key={action.name}
      borderRadius={20}
      onPress={action.onPress}
      testID={`Earn/BeforeDepositBottomSheet/${action.name}`}
    >
      <>
        <action.iconComponent color={Colors.black} />
        <View style={styles.cardContainer}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionDetails}>{action.details}</Text>
        </View>
      </>
    </Touchable>
  )
}

function AddAction({
  token,
  forwardedRef,
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  const action = {
    name: BeforeDepositActionName.Add,
    title: t('earnFlow.beforeDepositBottomSheet.action.add'),
    details: t('earnFlow.beforeDepositBottomSheet.action.addDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsAdd,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
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
  return <ActionCard action={action} />
}

function TransferAction({
  token,
  exchanges,
  forwardedRef,
}: {
  token: TokenBalance
  exchanges: ExternalExchangeProvider[]
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  const action = {
    name: BeforeDepositActionName.Transfer,
    title: t('earnFlow.beforeDepositBottomSheet.action.transfer'),
    details: t('earnFlow.beforeDepositBottomSheet.action.transferDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: QuickActionsSend,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: BeforeDepositActionName.Transfer,
        ...getTokenAnalyticsProps(token),
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
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  const action = {
    name: BeforeDepositActionName.CrossChainSwap,
    title: t('earnFlow.beforeDepositBottomSheet.action.crossChainSwap'),
    details: t('earnFlow.beforeDepositBottomSheet.action.crossChainSwapDescription', {
      tokenSymbol: token.symbol,
    }),
    iconComponent: SwapArrows,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: BeforeDepositActionName.CrossChainSwap,
        ...getTokenAnalyticsProps(token),
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
}: {
  token: TokenBalance
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  const action = {
    name: BeforeDepositActionName.Swap,
    title: t('earnFlow.beforeDepositBottomSheet.action.swap'),
    details: t('earnFlow.beforeDepositBottomSheet.action.swapDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: SwapArrows,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: BeforeDepositActionName.Swap,
        ...getTokenAnalyticsProps(token),
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
}: {
  token: TokenBalance
  pool: EarnPosition
  forwardedRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  const action = {
    name: BeforeDepositActionName.SwapAndDeposit,
    title: t('earnFlow.beforeDepositBottomSheet.action.swapAndDeposit'),
    details: t('earnFlow.beforeDepositBottomSheet.action.swapAndDepositDescription', {
      tokenSymbol: token.symbol,
      tokenNetwork: NETWORK_NAMES[token.networkId],
    }),
    iconComponent: SwapAndDeposit,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_before_deposit_action_press, {
        action: BeforeDepositActionName.SwapAndDeposit,
        ...getTokenAnalyticsProps(token),
      })

      navigate(Screens.EarnEnterAmount, { pool, mode: 'swap-deposit' })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

export default function BeforeDepositBottomSheet({
  forwardedRef,
  token,
  pool,
  hasTokensOnSameNetwork,
  hasTokensOnOtherNetworks,
  canAdd,
  exchanges,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  token: TokenBalance
  pool: EarnPosition
  hasTokensOnSameNetwork: boolean
  hasTokensOnOtherNetworks: boolean
  canAdd: boolean
  exchanges: ExternalExchangeProvider[]
}) {
  const { t } = useTranslation()

  const { availableShortcutIds } = pool
  const canSwapDeposit =
    getFeatureGate(StatsigFeatureGates.SHOW_SWAP_AND_DEPOSIT) &&
    availableShortcutIds.includes('swap-deposit') &&
    hasTokensOnSameNetwork

  const title = canSwapDeposit
    ? t('earnFlow.beforeDepositBottomSheet.youNeedTitle', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      })
    : t('earnFlow.beforeDepositBottomSheet.beforeYouCanDepositTitle')

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={title}
      description={
        !canSwapDeposit
          ? t('earnFlow.beforeDepositBottomSheet.beforeYouCanDepositDescription')
          : undefined
      }
      titleStyle={styles.bottomSheetTitle}
      testId={'Earn/BeforeDepositBottomSheet'}
    >
      <View style={styles.actionsContainer}>
        {canSwapDeposit && (
          <>
            <SwapAndDepositAction token={token} pool={pool} forwardedRef={forwardedRef} />
            <Text style={styles.actionDetails}>
              {t('earnFlow.beforeDepositBottomSheet.crossChainAlternativeDescription', {
                tokenNetwork: NETWORK_NAMES[token.networkId],
              })}
            </Text>
            {hasTokensOnOtherNetworks && (
              <CrossChainSwapAction token={token} forwardedRef={forwardedRef} />
            )}
          </>
        )}
        {!canSwapDeposit && (hasTokensOnSameNetwork || hasTokensOnOtherNetworks) && (
          <SwapAction token={token} forwardedRef={forwardedRef} />
        )}
        {canAdd && <AddAction token={token} forwardedRef={forwardedRef} />}
        {!canSwapDeposit && (
          <TransferAction token={token} exchanges={exchanges} forwardedRef={forwardedRef} />
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
  actionTitle: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  actionDetails: {
    ...typeScale.bodySmall,
    color: Colors.black,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  touchable: {
    backgroundColor: Colors.gray1,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
  },
})

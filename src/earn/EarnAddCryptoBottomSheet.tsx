import BigNumber from 'bignumber.js'
import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { CICOFlow } from 'src/fiatExchanges/utils'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { NETWORK_NAMES } from 'src/shared/conts'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useCashInTokens, useSwappableTokens, useTokenToLocalAmount } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { TokenActionName } from 'src/tokens/types'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

export default function EarnAddCryptoBottomSheet({
  forwardedRef,
  token,
  tokenAmount,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  token: TokenBalance
  tokenAmount: BigNumber
}) {
  const { t } = useTranslation()
  const { swappableFromTokens } = useSwappableTokens()
  const cashInTokens = useCashInTokens()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)

  const showAdd = !!cashInTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId)
  const showSwap =
    isSwapEnabled &&
    !!swappableFromTokens.find(
      (tokenInfo) => tokenInfo.networkId === token.networkId && tokenInfo.tokenId !== token.tokenId
    )
  const addAmount = {
    crypto: tokenAmount.toNumber(),
    fiat: Math.round(
      (useTokenToLocalAmount(tokenAmount, token.tokenId) || new BigNumber(0)).toNumber()
    ),
  }

  const actions = [
    {
      name: TokenActionName.Add,
      title: t('earnFlow.addCryptoBottomSheet.actions.add'),
      details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.add', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      }),
      iconComponent: QuickActionsAdd,
      onPress: () => {
        navigate(Screens.SelectProvider, {
          tokenId: token.tokenId,
          flow: CICOFlow.CashIn,
          amount: addAmount,
        })
      },
      visible: showAdd,
    },
    {
      name: TokenActionName.Transfer,
      title: t('earnFlow.addCryptoBottomSheet.actions.transfer'),
      details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.transfer', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      }),
      iconComponent: QuickActionsSend,
      onPress: () => {
        navigate(Screens.ExchangeQR, { flow: CICOFlow.CashIn, exchanges: [] })
      },
      visible: true,
    },
    {
      name: TokenActionName.Swap,
      title: t('earnFlow.addCryptoBottomSheet.actions.swap'),
      details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.swap', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      }),
      iconComponent: QuickActionsSwap,
      onPress: () => {
        navigate(Screens.SwapScreenWithBack, { toTokenId: token.tokenId })
      },
      visible: showSwap,
    },
  ].filter((action) => action.visible)

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('earnFlow.addCryptoBottomSheet.title', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      })}
      description={t('earnFlow.addCryptoBottomSheet.description')}
      testId={'Earn/AddCrypto'}
      titleStyle={styles.title}
    >
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <Touchable
            style={styles.touchable}
            key={action.name}
            borderRadius={20}
            onPress={() => {
              ValoraAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
                action: action.name,
                ...getTokenAnalyticsProps(token),
              })
              action.onPress()
            }}
            testID={`Earn/AddCrypto/${action.name}`}
          >
            <>
              <action.iconComponent color={Colors.black} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDetails}>{action.details}</Text>
              </View>
            </>
          </Touchable>
        ))}
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
  title: {
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
})

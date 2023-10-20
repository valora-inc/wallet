import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import { TokenProperties } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { TOKEN_MIN_AMOUNT } from 'src/config'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import { CICOFlow } from 'src/fiatExchanges/utils'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import DataDown from 'src/icons/DataDown'
import DataUp from 'src/icons/DataUp'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsMore from 'src/icons/quick-actions/More'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import QuickActionsWithdraw from 'src/icons/quick-actions/Withdraw'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import {
  useCashInTokens,
  useCashOutTokens,
  useSwappableTokens,
  useTokenInfo,
  useTokensForSend,
} from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { TokenDetailsActionName } from 'src/tokens/types'
import { getTokenAnalyticsProps, isCicoToken, isHistoricalPriceUpdated } from 'src/tokens/utils'
import { Network } from 'src/transactions/types'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenDetails>

const MAX_ACTION_BUTTONS = 3

export default function TokenDetailsScreen({ route }: Props) {
  const { tokenId } = route.params
  const { t } = useTranslation()
  const token = useTokenInfo(tokenId)

  if (!token) {
    throw new Error(`token with id ${tokenId} not found`)
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'bottom', 'left']}>
      <ScrollView>
        <View style={styles.titleContainer}>
          <TokenIcon
            token={token}
            viewStyle={styles.tokenImg}
            testID="TokenDetails/TitleImage"
            size={IconSize.SMALL}
          />
          <Text style={styles.tokenName} testID="TokenDetails/Title">
            {token.name}
          </Text>
        </View>
        <TokenDisplay
          amount={token.balance}
          tokenId={tokenId}
          style={styles.balance}
          testID="TokenDetails/Balance"
        />
        {!token.isStableCoin && <PriceInfo token={token} />}
        {token.isNative && token.symbol === 'CELO' && (
          <CeloGoldHistoryChart
            color={Colors.dark}
            containerStyle={styles.chartContainer}
            chartPadding={Spacing.Thick24}
            testID="TokenDetails/Chart"
          />
        )}
        <Actions token={token} />
        <Text style={styles.yourBalance}>{t('tokenDetails.yourBalance')}</Text>
        <TokenBalanceItem token={token} />
        {token.infoUrl && (
          <LearnMore
            tokenName={token.name}
            infoUrl={token.infoUrl}
            analyticsProps={getTokenAnalyticsProps(token)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

TokenDetailsScreen.navigationOptions = {
  ...headerWithBackButton,
}

function PriceInfo({ token }: { token: TokenBalance }) {
  const { t } = useTranslation()
  if (!token.priceUsd) {
    return (
      <View style={styles.priceInfo}>
        <Text style={styles.priceInfoUnavailable}>{t('tokenDetails.priceUnavailable')}</Text>
      </View>
    )
  }

  if (!token.historicalPricesUsd || !isHistoricalPriceUpdated(token)) {
    return null
  }

  return (
    <View style={styles.priceInfo}>
      <PercentageIndicator
        comparedValue={token.historicalPricesUsd.lastDay.price}
        currentValue={token.priceUsd!}
        percentageTextStyle={styles.priceInfoText}
        UpIcon={DataUp}
        DownIcon={DataDown}
        NoChangeIcon={DataUp}
        suffixText={t('tokenDetails.priceDeltaSuffix') ?? undefined}
        suffixTextStyle={typeScale.bodySmall}
        testID="TokenDetails/PriceDelta"
      />
    </View>
  )
}

function Actions({ token }: { token: TokenBalance }) {
  const { t } = useTranslation()
  const sendableTokens = useTokensForSend()
  const swappableTokens = useSwappableTokens()
  const cashInTokens = useCashInTokens()
  const cashOutTokens = useCashOutTokens()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const showWithdraw = !!cashOutTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId)

  const onPressCicoAction = (flow: CICOFlow) => {
    const tokenSymbol = token.symbol
    // this should always be true given that we only show Add / Withdraw if a
    // token is CiCoCurrency, but adding it here to ensure type safety
    if (isCicoToken(tokenSymbol)) {
      navigate(Screens.FiatExchangeAmount, {
        currency: tokenSymbol,
        tokenId: token.tokenId,
        flow,
        network: Network.Celo,
      })
    }
  }

  const actions = [
    {
      name: TokenDetailsActionName.Send,
      text: t('tokenDetails.actions.send'),
      iconComponent: QuickActionsSend,
      onPress: () => {
        navigate(Screens.Send, { defaultTokenIdOverride: token.tokenId })
      },
      visible: !!sendableTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId),
    },
    {
      name: TokenDetailsActionName.Swap,
      text: t('tokenDetails.actions.swap'),
      iconComponent: QuickActionsSwap,
      onPress: () => {
        navigate(Screens.SwapScreenWithBack, { fromTokenId: token.tokenId })
      },
      visible:
        isSwapEnabled &&
        !!swappableTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId) &&
        token.balance.gt(TOKEN_MIN_AMOUNT),
    },
    {
      name: TokenDetailsActionName.Add,
      text: t('tokenDetails.actions.add'),
      iconComponent: QuickActionsAdd,
      onPress: () => {
        onPressCicoAction(CICOFlow.CashIn)
      },
      visible: !!cashInTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId),
    },
    {
      name: TokenDetailsActionName.Withdraw,
      text: t('tokenDetails.actions.withdraw'),
      iconComponent: QuickActionsWithdraw,
      onPress: () => {
        onPressCicoAction(CICOFlow.CashOut)
      },
      visible: showWithdraw,
    },
  ].filter((action) => action.visible)

  const moreAction = {
    name: TokenDetailsActionName.More,
    text: t('tokenDetails.actions.more'),
    iconComponent: QuickActionsMore,
    onPress: () => {
      // TODO(ACT-917): open bottom sheet
    },
  }

  // if there are 4 actions or 3 actions and one of them is withdraw, show the
  // More button. The withdraw condition exists to avoid the visual overflow,
  // since the icon + withdraw text is bigger
  const actionButtons =
    actions.length > MAX_ACTION_BUTTONS || (actions.length === MAX_ACTION_BUTTONS && showWithdraw)
      ? [...actions.slice(0, MAX_ACTION_BUTTONS - 1), moreAction]
      : actions

  return (
    <View
      style={[
        styles.actions,
        {
          gap: actionButtons.length === MAX_ACTION_BUTTONS ? Spacing.Smallest8 : Spacing.Regular16,
        },
      ]}
    >
      {actionButtons.map((action) => (
        <Button
          key={action.name}
          text={action.text}
          onPress={() => {
            ValoraAnalytics.track(AssetsEvents.tap_token_details_action, {
              action: action.name,
              ...getTokenAnalyticsProps(token),
            })
            action.onPress()
          }}
          icon={<action.iconComponent color={Colors.white} />}
          style={styles.actionButton}
          size={BtnSizes.FULL}
          touchableStyle={styles.actionTouchable}
          testID={`TokenDetails/Action/${action.name}`}
          fontStyle={typeScale.labelMedium}
        />
      ))}
    </View>
  )
}

function LearnMore({
  tokenName,
  infoUrl,
  analyticsProps,
}: {
  tokenName: string
  infoUrl: string
  analyticsProps: TokenProperties
}) {
  const { t } = useTranslation()

  const onPress = () => {
    ValoraAnalytics.track(AssetsEvents.tap_token_details_learn_more, analyticsProps)
    navigate(Screens.WebViewScreen, { uri: infoUrl })
  }

  return (
    <View style={styles.learnMoreContainer}>
      <Touchable onPress={onPress}>
        <View style={styles.learnMoreTouchableContainer}>
          <Text style={styles.learnMoreText} testID="TokenDetails/LearnMore">
            {t('tokenDetails.learnMore', { tokenName: tokenName })}
          </Text>
          <ArrowRightThick />
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
  },
  tokenName: {
    ...typeScale.labelLarge,
    color: Colors.dark,
  },
  tokenImg: {
    marginRight: Spacing.Tiny4,
  },
  balance: {
    ...typeScale.titleLarge,
    color: Colors.dark,
    marginHorizontal: Spacing.Thick24,
  },
  chartContainer: {
    marginTop: 40,
    marginBottom: 0,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 40,
    marginBottom: Spacing.Regular16,
    marginHorizontal: Spacing.Thick24,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 0,
  },
  actionTouchable: {
    paddingLeft: 14,
    paddingRight: Spacing.Regular16,
    paddingVertical: Spacing.Regular16,
    height: 56,
  },
  yourBalance: {
    ...typeScale.labelMedium,
    color: Colors.dark,
    marginTop: Spacing.Regular16,
    marginHorizontal: Spacing.Thick24,
  },
  learnMoreContainer: {
    borderTopColor: Colors.gray2,
    borderTopWidth: 1,
    paddingTop: Spacing.Regular16,
    marginHorizontal: Spacing.Thick24,
  },
  learnMoreTouchableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  learnMoreText: {
    ...typeScale.labelSmall,
    color: Colors.gray3,
  },
  priceInfo: {
    marginTop: Spacing.Tiny4,
    marginHorizontal: Spacing.Thick24,
  },
  priceInfoText: {
    ...typeScale.labelSmall,
  },
  priceInfoUnavailable: {
    ...typeScale.labelSmall,
    color: Colors.gray3,
  },
})

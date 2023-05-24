import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { hideAlert, showToast } from 'src/alert/actions'
import { AssetsEvents, FiatExchangeEvents, HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Dialog from 'src/components/Dialog'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import { isE2EEnv } from 'src/config'
import { refreshAllBalances } from 'src/home/actions'
import InfoIcon from 'src/icons/InfoIcon'
import ProgressArrow from 'src/icons/ProgressArrow'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import {
  getLocalCurrencySymbol,
  localCurrencyExchangeRateErrorSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import {
  stalePriceSelector,
  tokenFetchErrorSelector,
  tokenFetchLoadingSelector,
  tokensInfoUnavailableSelector,
  tokensWithTokenBalanceSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'

function TokenBalance({
  style = styles.balance,
  singleTokenViewEnabled = true,
}: {
  style?: StyleProp<TextStyle>
  singleTokenViewEnabled?: boolean
}) {
  const tokensWithUsdValue = useSelector(tokensWithUsdValueSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector)
  const tokenFetchLoading = useSelector(tokenFetchLoadingSelector)
  const tokenFetchError = useSelector(tokenFetchErrorSelector)
  const tokensAreStale = useSelector(stalePriceSelector)
  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal =
    totalTokenBalanceLocal || totalPositionsBalanceLocal
      ? new BigNumber(totalTokenBalanceLocal ?? 0).plus(totalPositionsBalanceLocal ?? 0)
      : undefined

  if (tokenFetchError || tokenFetchLoading || tokensAreStale) {
    // Show '-' if we haven't fetched the tokens yet or prices are stale
    return (
      <Text style={style} testID={'TotalTokenBalance'}>
        {localCurrencySymbol}
        {'-'}
      </Text>
    )
  } else if (
    singleTokenViewEnabled &&
    tokensWithUsdValue.length === 1 &&
    !totalPositionsBalanceLocal?.isGreaterThan(0)
  ) {
    const tokenBalance = tokensWithUsdValue[0].balance
    return (
      <View style={styles.oneBalance}>
        <Image source={{ uri: tokensWithUsdValue[0].imageUrl }} style={styles.tokenImg} />
        <View style={styles.column}>
          <Text style={style} testID={'TotalTokenBalance'}>
            {localCurrencySymbol}
            {totalTokenBalanceLocal?.toFormat(2) ?? '-'}
          </Text>
          <Text style={styles.tokenBalance}>
            {formatValueToDisplay(tokenBalance)} {tokensWithUsdValue[0].symbol}
          </Text>
        </View>
      </View>
    )
  } else {
    return (
      <Text style={style} testID={'TotalTokenBalance'}>
        {localCurrencySymbol}
        {totalBalanceLocal?.toFormat(2) ?? new BigNumber(0).toFormat(2)}
      </Text>
    )
  }
}

function useErrorMessageWithRefresh() {
  const { t } = useTranslation()

  const tokensInfoUnavailable = useSelector(tokensInfoUnavailableSelector)
  const tokenFetchError = useSelector(tokenFetchErrorSelector)
  const localCurrencyError = useSelector(localCurrencyExchangeRateErrorSelector)

  const dispatch = useDispatch()

  const shouldShowError =
    !isE2EEnv && tokensInfoUnavailable && (tokenFetchError || localCurrencyError)

  useEffect(() => {
    if (shouldShowError) {
      dispatch(
        showToast(
          t('outOfSyncBanner.message'),
          t('outOfSyncBanner.button'),
          refreshAllBalances(),
          t('outOfSyncBanner.title')
        )
      )
    } else {
      dispatch(hideAlert())
    }
  }, [shouldShowError])
}

export function AssetsTokenBalance({ showInfo }: { showInfo: boolean }) {
  const { t } = useTranslation()

  const [infoVisible, setInfoVisible] = useState(false)
  const [shouldRenderInfoComponent, setShouldRenderInfoComponent] = useState(false)
  const infoOpacity = useSharedValue(0)

  useShowOrHideAnimation(
    infoOpacity,
    infoVisible,
    () => {
      setShouldRenderInfoComponent(true)
    },
    () => {
      setShouldRenderInfoComponent(false)
    }
  )

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: infoOpacity.value,
    }
  })

  const toggleInfoVisible = () => {
    if (!infoVisible) {
      ValoraAnalytics.track(AssetsEvents.show_asset_balance_info)
    }
    setInfoVisible((prev) => !prev)
  }

  const handleDismissInfo = () => {
    setInfoVisible(false)
  }

  return (
    <TouchableWithoutFeedback onPress={handleDismissInfo}>
      <View testID="AssetsTokenBalance">
        <View style={styles.row}>
          <Text style={styles.totalAssets}>{t('totalAssets')}</Text>
          {showInfo && (
            <TouchableOpacity
              onPress={toggleInfoVisible}
              hitSlop={variables.iconHitslop}
              testID="AssetsTokenBalance/Info"
            >
              <InfoIcon color={Colors.greenUI} />
            </TouchableOpacity>
          )}
        </View>
        <TokenBalance singleTokenViewEnabled={false} />

        {shouldRenderInfoComponent && (
          <Animated.View style={[styles.totalAssetsInfoContainer, animatedStyles]}>
            <Text style={styles.totalAssetsInfoText}>{t('totalAssetsInfo')}</Text>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

export function HomeTokenBalance() {
  const { t } = useTranslation()
  const totalBalance = useSelector(totalTokenBalanceSelector)
  const tokenBalances = useSelector(tokensWithTokenBalanceSelector)

  useErrorMessageWithRefresh()

  const onViewBalances = () => {
    ValoraAnalytics.track(HomeEvents.view_token_balances, {
      totalBalance: totalBalance?.toString(),
    })
    navigate(Screens.TokenBalances)
  }

  const onCloseDialog = () => {
    setInfoVisible(false)
  }

  const [infoVisible, setInfoVisible] = useState(false)

  return (
    <View style={styles.container} testID="HomeTokenBalance">
      <View style={styles.title}>
        <View style={styles.row}>
          <Text style={styles.totalValue}>{t('totalValue')}</Text>
          {tokenBalances.length > 0 && (
            <TouchableOpacity onPress={() => setInfoVisible(true)} hitSlop={variables.iconHitslop}>
              <InfoIcon size={14} color={Colors.gray3} />
            </TouchableOpacity>
          )}
        </View>
        <Dialog
          title={t('whatTotalValue.title')}
          isVisible={infoVisible}
          actionText={t('whatTotalValue.dismiss')}
          actionPress={onCloseDialog}
          isActionHighlighted={false}
          onBackgroundPress={onCloseDialog}
        >
          {t('whatTotalValue.body')}
        </Dialog>
        {tokenBalances.length >= 1 && (
          <TouchableOpacity style={styles.row} onPress={onViewBalances} testID="ViewBalances">
            <Text style={styles.viewBalances}>{t('viewBalances')}</Text>
            <ProgressArrow style={styles.arrow} color={Colors.greenUI} />
          </TouchableOpacity>
        )}
      </View>
      <TokenBalance />
    </View>
  )
}

export function FiatExchangeTokenBalance() {
  const { t } = useTranslation()
  const totalBalance = useSelector(totalTokenBalanceSelector)
  const tokenBalances = useSelector(tokensWithTokenBalanceSelector)

  const onViewBalances = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_landing_token_balance, {
      totalBalance: totalBalance?.toString(),
    })
    navigate(Screens.TokenBalances)
  }

  return (
    <View style={styles.container} testID="FiatExchangeTokenBalance">
      <View style={styles.titleExchange}>
        <View style={styles.row}>
          {tokenBalances.length > 1 ? (
            <TouchableOpacity style={styles.row} onPress={onViewBalances} testID="ViewBalances">
              <Text style={styles.exchangeTotalValue}>{t('totalValue')}</Text>
              <ProgressArrow style={styles.exchangeArrow} height={9.62} color={Colors.gray4} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.exchangeTotalValue}>{t('totalValue')}</Text>
          )}
        </View>
      </View>
      <TokenBalance style={styles.exchangeBalance} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: variables.contentPadding,
  },
  totalAssets: {
    ...fontStyles.regular600,
    color: Colors.gray5,
    marginRight: 4,
  },
  totalAssetsInfoContainer: {
    position: 'absolute',
    top: 32,
    width: 190,
    paddingVertical: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
    backgroundColor: Colors.dark,
    borderRadius: 8,
  },
  totalAssetsInfoText: {
    ...fontStyles.small,
    color: Colors.light,
    textAlign: 'center',
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 7,
  },
  titleExchange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalValue: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
    paddingRight: 5,
  },
  exchangeTotalValue: {
    ...fontStyles.label,
    color: Colors.gray4,
    paddingRight: 3,
  },
  viewBalances: {
    ...fontStyles.label,
    color: Colors.greenUI,
    paddingRight: 8,
  },
  arrow: {
    paddingTop: 3,
  },
  exchangeArrow: {
    paddingTop: 4,
  },
  balance: {
    ...fontStyles.largeNumber,
  },
  exchangeBalance: {
    ...fontStyles.large500,
  },
  oneBalance: {
    flexDirection: 'row',
  },
  tokenImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
  },
  column: {
    flexDirection: 'column',
  },
  tokenBalance: {
    ...fontStyles.label,
    color: Colors.gray4,
  },
})

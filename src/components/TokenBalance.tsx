import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { hideAlert, showMessage } from 'src/alert/actions'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Dialog from 'src/components/Dialog'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { refreshAllBalances } from 'src/home/actions'
import InfoIcon from 'src/icons/InfoIcon'
import ProgressArrow from 'src/icons/ProgressArrow'
import {
  getLocalCurrencySymbol,
  localCurrencyExchangeRateErrorSelector,
} from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import {
  tokenFetchErrorSelector,
  tokenFetchLoadingSelector,
  tokensInfoUnavailableSelector,
  tokensWithTokenBalanceSelector,
  tokensWithUsdValueSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'

function TokenBalance({ style = styles.balance }: { style?: StyleProp<TextStyle> }) {
  const tokensWithUsdValue = useSelector(tokensWithUsdValueSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalBalance = useSelector(totalTokenBalanceSelector)
  const tokenFetchLoading = useSelector(tokenFetchLoadingSelector)
  const tokenFetchError = useSelector(tokenFetchErrorSelector)

  if (tokensWithUsdValue.length === 0) {
    // Don't show zero if we haven't fetched the tokens yet.
    return (
      <Text style={style} testID={'TotalTokenBalance'}>
        {localCurrencySymbol}
        {tokenFetchError || tokenFetchLoading ? '-' : new BigNumber(0).toFormat(2)}
      </Text>
    )
  } else if (tokensWithUsdValue.length === 1) {
    const tokenBalance = tokensWithUsdValue[0].balance
    return (
      <View style={styles.oneBalance}>
        <Image source={{ uri: tokensWithUsdValue[0].imageUrl }} style={styles.tokenImg} />
        <View style={styles.column}>
          <Text style={style} testID={'TotalTokenBalance'}>
            {localCurrencySymbol}
            {totalBalance?.toFormat(2) ?? '-'}
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
        {totalBalance?.toFormat(2) ?? '-'}
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

  const shouldShowError = tokensInfoUnavailable && (tokenFetchError || localCurrencyError)

  useEffect(() => {
    if (shouldShowError) {
      dispatch(
        showMessage(
          t('outOfSyncBanner.message'),
          null,
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
        {tokenBalances.length > 1 && (
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
    ValoraAnalytics.track(HomeEvents.view_token_balances, {
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
    flexDirection: 'column',
    margin: variables.contentPadding,
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

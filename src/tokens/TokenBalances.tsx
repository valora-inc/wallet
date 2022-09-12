import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, PixelRatio, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES } from 'src/config'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { sortByUsdBalance } from './utils'

type Props = StackScreenProps<StackParamList, Screens.TokenBalances>
function TokenBalancesScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const tokens = useSelector(tokensWithTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalBalance = useSelector(totalTokenBalanceSelector) ?? new BigNumber(0)
  const tokensAreStale = useSelector(stalePriceSelector)
  const showPriceChangeIndicatorInBalances = useSelector(showPriceChangeIndicatorInBalancesSelector)
  const shouldVisualizeNFTsInHomeAssetsPage = useSelector(
    visualizeNFTsEnabledInHomeAssetsPageSelector
  )
  const walletAddress = useSelector(walletAddressSelector)

  useLayoutEffect(() => {
    const subTitle =
      !tokensAreStale && totalBalance.gte(0)
        ? t('totalBalanceWithLocalCurrencySymbol', {
            localCurrencySymbol,
            totalBalance: totalBalance.toFormat(2),
          })
        : `${localCurrencySymbol} -`

    navigation.setOptions({
      headerTitle: () => <HeaderTitleWithSubtitle title={t('balances')} subTitle={subTitle} />,
    })
  }, [navigation, totalBalance, localCurrencySymbol])

  function isHistoricalPriceUpdated(token: TokenBalance) {
    return (
      token.historicalUsdPrices?.lastDay &&
      TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES >
        Math.abs(token.historicalUsdPrices.lastDay.at - (Date.now() - ONE_DAY_IN_MILLIS))
    )
  }

  function getTokenDisplay(token: TokenBalance) {
    return (
      <View key={`Token${token.address}`} style={styles.tokenContainer}>
        <View style={styles.row}>
          <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
          <View style={styles.tokenLabels}>
            <Text style={styles.tokenName}>{token.symbol}</Text>
            <Text style={styles.subtext}>{token.name}</Text>
          </View>
        </View>
        <View style={styles.balances}>
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.tokenAmt}
            showLocalAmount={false}
            showSymbol={false}
            testID={`tokenBalance:${token.symbol}`}
          />
          {token.usdPrice?.gt(0) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {showPriceChangeIndicatorInBalances &&
                token.historicalUsdPrices &&
                isHistoricalPriceUpdated(token) && (
                  <PercentageIndicator
                    testID={`percentageIndicator:${token.symbol}`}
                    comparedValue={token.historicalUsdPrices.lastDay.price}
                    currentValue={token.usdPrice}
                  />
                )}
              <TokenDisplay
                amount={new BigNumber(token.balance!)}
                tokenAddress={token.address}
                style={{ ...styles.subtext, marginLeft: 8 }}
                testID={`tokenLocalBalance:${token.symbol}`}
              />
            </View>
          )}
        </View>
      </View>
    )
  }

  const onPressNFTsBanner = () => {
    ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  return (
    <>
      {shouldVisualizeNFTsInHomeAssetsPage && (
        <Touchable
          style={
            // For larger fonts we need different marginTop for nft banner
            PixelRatio.getFontScale() > 1.5
              ? { marginTop: Spacing.Small12 }
              : PixelRatio.getFontScale() > 1.25
              ? { marginTop: Spacing.Smallest8 }
              : null
          }
          testID={'NftViewerBanner'}
          onPress={onPressNFTsBanner}
        >
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerText}>{t('nftViewer')}</Text>
            <View style={styles.rightInnerContainer}>
              <Text style={styles.bannerText}>{t('open')}</Text>
              <OpenLinkIcon />
            </View>
          </View>
        </Touchable>
      )}
      {!shouldVisualizeNFTsInHomeAssetsPage && showPriceChangeIndicatorInBalances && (
        <View style={styles.lastDayLabel}>
          <Text style={styles.lastDayText}>{t('lastDay')}</Text>
        </View>
      )}
      <ScrollView style={styles.scrollContainer}>
        {tokens.sort(sortByUsdBalance).map(getTokenDisplay)}
      </ScrollView>
    </>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: variables.contentPadding,
  },
  tokenImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenContainer: {
    flexDirection: 'row',
    paddingTop: variables.contentPadding,
  },
  tokenLabels: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  balances: {
    flex: 9,
    alignItems: 'flex-end',
  },
  row: {
    flex: 11,
    flexDirection: 'row',
  },
  tokenName: {
    ...fontStyles.large600,
  },
  subtext: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
  lastDayText: {
    ...fontStyles.small500,
    color: Colors.gray4,
    marginHorizontal: Spacing.Regular16,
  },
  lastDayLabel: {
    marginTop: Spacing.Regular16,
    flexDirection: 'row-reverse',
  },
  bannerContainer: {
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.greenUI,
    flexDirection: 'row',
  },
  bannerText: {
    ...fontStyles.displayName,
    color: Colors.light,
  },
  rightInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default TokenBalancesScreen

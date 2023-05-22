import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, PixelRatio, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import TokenBalanceItem from 'src/tokens/TokenBalanceItem'
import { sortByUsdBalance } from 'src/tokens/utils'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>

function TokenBalancesScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const tokens = useSelector(tokensWithTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector) ?? new BigNumber(0)
  const tokensAreStale = useSelector(stalePriceSelector)
  const showPriceChangeIndicatorInBalances = useSelector(showPriceChangeIndicatorInBalancesSelector)
  const shouldVisualizeNFTsInHomeAssetsPage = useSelector(
    visualizeNFTsEnabledInHomeAssetsPageSelector
  )
  const walletAddress = useSelector(walletAddressSelector)
  const insets = useSafeAreaInsets()

  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const [assetsComponentHeight, setAssetsComponentHeight] = useState(0)
  const headerOpacity = useSharedValue(0)
  const animatedHeaderOpacity = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    }
  })

  const scrollHandler = useAnimatedScrollHandler(
    (event) => {
      const opacityValue = event.contentOffset.y > assetsComponentHeight ? 1 : 0
      headerOpacity.value = withTiming(opacityValue)
    },
    [assetsComponentHeight]
  )

  useLayoutEffect(() => {
    const subTitle =
      !tokensAreStale && totalBalanceLocal.gte(0)
        ? t('totalBalanceWithLocalCurrencySymbol', {
            localCurrencySymbol,
            totalBalance: totalBalanceLocal.toFormat(2),
          })
        : `${localCurrencySymbol} -`

    navigation.setOptions({
      headerTitle: () => (
        <Animated.View style={animatedHeaderOpacity}>
          <HeaderTitleWithSubtitle title={t('totalAssets')} subTitle={subTitle} />
        </Animated.View>
      ),
    })
  }, [navigation, totalBalanceLocal, localCurrencySymbol, animatedHeaderOpacity])

  function renderTokenBalance({ item: token }: { item: TokenBalance }) {
    return (
      <TokenBalanceItem
        token={token}
        showPriceChangeIndicatorInBalances={showPriceChangeIndicatorInBalances}
      />
    )
  }

  const onPressNFTsBanner = () => {
    ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  const handleMeasureHeaderHeight = (event: LayoutChangeEvent) => {
    setAssetsComponentHeight(event.nativeEvent.layout.height)
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
              <OpenLinkIcon color={Colors.greenUI} />
            </View>
          </View>
        </Touchable>
      )}
      {!shouldVisualizeNFTsInHomeAssetsPage && showPriceChangeIndicatorInBalances && (
        <View style={styles.lastDayLabel}>
          <Text style={styles.lastDayText}>{t('lastDay')}</Text>
        </View>
      )}

      <Animated.FlatList
        style={styles.flatListContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        data={tokens.sort(sortByUsdBalance)}
        renderItem={renderTokenBalance}
        keyExtractor={(item) => item.address}
        ListHeaderComponent={<AssetsTokenBalance onLayout={handleMeasureHeaderHeight} />}
        onScroll={scrollHandler}
      />
    </>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  flatListContainer: {
    paddingHorizontal: Spacing.Thick24,
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
    marginTop: Spacing.Smallest8,
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
  },
  bannerText: {
    ...fontStyles.small500,
    color: Colors.greenUI,
    marginRight: 4,
  },
  rightInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default TokenBalancesScreen

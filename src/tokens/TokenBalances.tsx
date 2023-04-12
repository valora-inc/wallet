import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
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
  tokensByAddressSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { sortByUsdBalance } from './utils'

interface AbstractPosition {
  label: string // Example: Pool
  tokens: Token[]
}

interface AbstractToken {
  address: string // Example: 0x...
  network: string // Example: celo

  // These would be resolved dynamically
  symbol: string // Example: cUSD
  decimals: number // Example: 18
  priceUsd: number // Example: 1.5
  balance: string // Example: "2000000000000", would be negative for debt
}

interface BaseToken extends AbstractToken {
  type: 'base-token'
}

interface AppTokenPosition extends AbstractPosition, AbstractToken {
  type: 'app-token'
  supply: string
  // Price ratio between the token and underlying token(s)
  pricePerShare: number[]
}

interface ContractPosition extends AbstractPosition {
  type: 'contract-position'
  address: string
  // This would be derived from the underlying tokens
  balanceUsd: string
}

type Token = BaseToken | AppTokenPosition
type Position = AppTokenPosition | ContractPosition

const TEST_RESPONSE = {
  message: 'OK',
  data: [
    {
      type: 'app-token',
      network: 'celo',
      address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
      symbol: 'ULP',
      decimals: 18,
      label: 'Pool: MOO / CELO',
      tokens: [
        {
          type: 'base-token',
          network: 'celo',
          address: '0x17700282592d6917f6a73d0bf8accf4d578c131e',
          symbol: 'MOO',
          decimals: 18,
          priceUsd: 0.006945061569050171,
          balance: '180868419020792201216',
        },
        {
          type: 'base-token',
          network: 'celo',
          address: '0x471ece3750da237f93b8e339c536989b8978a438',
          symbol: 'CELO',
          decimals: 18,
          priceUsd: 0.6959536890241361,
          balance: '1801458498251141632',
        },
      ],
      pricePerShare: [15.203387577266431, 0.15142650055521278],
      priceUsd: 0.21097429445966362,
      balance: '11896586737763895000',
      supply: '29726018516587721136286',
    },
    {
      type: 'app-token',
      network: 'celo',
      address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
      symbol: 'ULP',
      decimals: 18,
      label: 'Pool: G$ / cUSD',
      tokens: [
        {
          type: 'base-token',
          network: 'celo',
          address: '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
          symbol: 'G$',
          decimals: 18,
          priceUsd: 0.00016235559507324788,
          balance: '1.2400197092864986e+22',
        },
        {
          type: 'base-token',
          network: 'celo',
          address: '0x765de816845861e75a25fca122bb6898b8b1282a',
          symbol: 'cUSD',
          decimals: 18,
          priceUsd: 1,
          balance: '2066998331535406848',
        },
      ],
      pricePerShare: [77.49807502864574, 0.012918213362397938],
      priceUsd: 0.025500459450704928,
      balance: '160006517430032700000',
      supply: '232413684885485035933',
    },
    {
      type: 'contract-position',
      address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
      label: 'Farm: Pool: CELO / cUSD',
      tokens: [
        {
          type: 'app-token',
          network: 'celo',
          address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
          symbol: 'ULP',
          decimals: 18,
          label: 'Pool: CELO / cUSD',
          tokens: [
            {
              type: 'base-token',
              network: 'celo',
              address: '0x471ece3750da237f93b8e339c536989b8978a438',
              symbol: 'CELO',
              decimals: 18,
              priceUsd: 0.6959536890241361,
              balance: '950545800159603456',
            },
            {
              type: 'base-token',
              network: 'celo',
              address: '0x765de816845861e75a25fca122bb6898b8b1282a',
              symbol: 'cUSD',
              decimals: 18,
              priceUsd: 1,
              balance: '659223169268731392',
            },
          ],
          pricePerShare: [2.827719585853931, 1.961082008754231],
          priceUsd: 3.9290438860550765,
          balance: '336152780111169400',
          supply: '42744727037884449180591',
        },
      ],
      balanceUsd: '1.3207590254762067',
    },
  ],
}

function getBaseTokens(tokens: Token[]): BaseToken[] {
  return tokens.flatMap((token) => {
    if (token.type === 'base-token') {
      return [token]
    } else {
      return getBaseTokens(token.tokens)
    }
  })
}

function PositionDisplay({ position }: { position: Position }) {
  const tokens = useSelector(tokensByAddressSelector)

  const baseTokens = getBaseTokens(position.tokens)
  const baseTokenImages = baseTokens
    .map((token) => {
      const tokenInfo = tokens[token.address]
      return tokenInfo ? tokenInfo.imageUrl : undefined
    })
    .filter((image) => image !== undefined)

  const balanceInDecimal =
    position.type === 'contract-position'
      ? undefined
      : new BigNumber(position.balance).dividedBy(new BigNumber(10).pow(position.decimals))
  const balanceUsd =
    position.type === 'contract-position'
      ? new BigNumber(position.balanceUsd)
      : new BigNumber(position.balance)
          .dividedBy(new BigNumber(10).pow(position.decimals))
          .multipliedBy(position.priceUsd)

  return (
    <View style={styles.tokenContainer}>
      <View style={styles.row}>
        {/* <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} /> */}
        <View style={{ flexDirection: 'row-reverse' }}>
          {baseTokenImages.reverse().map((image, index) => (
            <Image
              source={{ uri: image }}
              style={[styles.tokenImg, { marginRight: index > 0 ? -20 : 12 }]}
              key={index}
            />
          ))}
        </View>
        <View style={styles.tokenLabels}>
          <Text style={styles.tokenName}>{position.label}</Text>
          <Text style={styles.subtext}>Ubeswap</Text>
        </View>
      </View>
      <View style={styles.balances}>
        {/* <TokenDisplay
          amount={new BigNumber(token.balance!)}
          tokenAddress={token.address}
          style={styles.tokenAmt}
          showLocalAmount={false}
          showSymbol={false}
          testID={`tokenBalance:${token.symbol}`}
        /> */}
        {balanceInDecimal && (
          <CurrencyDisplay
            style={styles.tokenAmt}
            amount={{ value: balanceInDecimal, currencyCode: 'cGLD' }}
          />
        )}
        {!balanceInDecimal && <Text style={styles.tokenAmt}>{'-'}</Text>}
        {balanceUsd.gt(0) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* <TokenDisplay
              amount={new BigNumber(token.balance!)}
              tokenAddress={token.address}
              style={{ ...styles.subtext, marginLeft: 8 }}
              testID={`tokenLocalBalance:${token.symbol}`}
            /> */}
            <CurrencyDisplay
              style={{ ...styles.subtext, marginLeft: 8 }}
              amount={{ value: balanceUsd, currencyCode: 'cUSD' }}
            />
            {/* <Text style={{ ...styles.subtext, marginLeft: 8 }}>{balanceUsd.toString()}</Text> */}
          </View>
        )}
      </View>
    </View>
  )
}

function Positions() {
  const walletAddress = useSelector(walletAddressSelector)
  const asyncPositions = useAsync(
    async () => {
      // return TEST_RESPONSE.data as Position[]

      console.log('Fetching positions...')
      const response = await fetch(
        'https://plugins-api-oaxbpxoaha-uc.a.run.app/balances?' +
          new URLSearchParams({ network: 'celo', address: walletAddress ?? '' })
      )
      if (!response.ok) {
        throw new Error(`Unable to fetch positions: ${response.status} ${response.statusText}`)
      }
      const json = await response.json()
      return json.data as Position[]
    },
    [],
    {
      onError: (error) => {
        console.error(error)
      },
      onSuccess: (result) => {
        console.log('Fetched positions:', result)
      },
    }
  )

  if (asyncPositions.loading) {
    return <ActivityIndicator />
  }

  if (!Array.isArray(asyncPositions.result)) {
    return null
  }

  return (
    <>
      {asyncPositions.result.map((position) => (
        <PositionDisplay key={position.address} position={position} />
      ))}
    </>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>
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
  const insets = useSafeAreaInsets()

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
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
      >
        {tokens.sort(sortByUsdBalance).map(getTokenDisplay)}
        <Positions />
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
    flex: 4,
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

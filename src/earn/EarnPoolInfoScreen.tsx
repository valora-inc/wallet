import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { Duration, intervalToDuration } from 'date-fns'
import React, { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import type { EarningItem } from 'src/positions/types'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo, useTokensInfo } from 'src/tokens/hooks'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { formattedDuration } from 'src/utils/time'

function HeaderTitleSection({
  earnPosition,
  tokensInfo,
}: {
  earnPosition: EarnPosition
  tokensInfo: TokenBalance[]
}) {
  return (
    <View style={styles.headerTitle}>
      {/* View wrapper is needed to prevent token icons from overlapping title text */}
      <View>
        <TokenIcons tokensInfo={tokensInfo} size={IconSize.SMALL} />
      </View>
      <Text style={styles.headerTitleText}>{earnPosition.displayProps.title}</Text>
    </View>
  )
}

function TitleSection({
  title,
  tokensInfo,
  providerName,
  networkName,
  onLayout,
}: {
  title: string
  tokensInfo: TokenBalance[]
  providerName: string
  networkName: string
  onLayout?: (event: LayoutChangeEvent) => void
}) {
  return (
    <View testID="TitleSection" onLayout={onLayout} style={styles.titleContainer}>
      <TokenIcons tokensInfo={tokensInfo} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleLabel}>
          <Trans i18nKey="earnFlow.poolInfoScreen.chainName" values={{ networkName }}>
            <Text style={styles.subtitleInfo}></Text>
          </Trans>
        </Text>
        <Text style={styles.subtitleLabel}>
          <Trans i18nKey="earnFlow.poolInfoScreen.protocolName" values={{ providerName }}>
            <Text style={styles.subtitleInfo}></Text>
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function TokenIcons({
  tokensInfo,
  size = IconSize.MEDIUM,
  showNetworkIcon = true,
}: {
  tokensInfo: TokenBalance[]
  size?: IconSize
  showNetworkIcon?: boolean
}) {
  return (
    <View style={styles.tokenIconsContainer}>
      {tokensInfo.map((token, index) => (
        <TokenIcon
          key={token.tokenId}
          token={token}
          viewStyle={!!index && { marginLeft: -Spacing.Regular16, zIndex: -index }}
          size={size}
          showNetworkIcon={showNetworkIcon}
        />
      ))}
    </View>
  )
}

function Card({
  children,
  testID,
  cardStyle,
}: {
  children: React.ReactNode
  testID: string
  cardStyle?: ViewStyle
}) {
  return (
    <View testID={testID} style={[styles.card, cardStyle]}>
      {children}
    </View>
  )
}

function EarningItemLineItem({ earnItem }: { earnItem: EarningItem }) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(earnItem.tokenId)
  const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(earnItem.amount)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    amountInUsd ?? 0
  )
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  return (
    <View style={styles.cardLineContainer}>
      <View style={styles.cardLineLabel}>
        <Text style={styles.depositAndEarningsCardLabelText}>{earnItem.label}</Text>
      </View>
      <View>
        <Text style={styles.depositAndEarningsCardLabelText}>
          {t('earnFlow.poolInfoScreen.lineItemAmountDisplay', {
            localCurrencySymbol,
            localCurrencyAmount: formatValueToDisplay(amountInLocalCurrency),
            cryptoAmount: formatValueToDisplay(new BigNumber(earnItem.amount)),
            cryptoSymbol: tokenInfo?.symbol,
          })}
        </Text>
      </View>
    </View>
  )
}

function DepositAndEarningsCard({ earnPosition }: { earnPosition: EarnPosition }) {
  const { t } = useTranslation()
  const { balance } = earnPosition
  const { earningItems, depositTokenId } = earnPosition.dataProps
  const tokenInfo = useTokenInfo(depositTokenId)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  // Total balance in local currency
  const depositBalanceInUsd = tokenInfo?.priceUsd?.multipliedBy(balance)
  const depositBalanceInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    depositBalanceInUsd ?? 0
  )
  const earningItemsTokenIds = earningItems.map((item) => item.tokenId)
  const earningItemsTokenInfo = useTokensInfo(earningItemsTokenIds)
  const totalBalanceInLocalCurrency = depositBalanceInLocalCurrency.plus(
    earningItems.reduce((acc, item) => {
      const tokenInfo = earningItemsTokenInfo.find((token) => token?.tokenId === item.tokenId)
      const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(item.amount)
      const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
        amountInUsd ?? 0
      )
      return acc.plus(amountInLocalCurrency ?? 0)
    }, new BigNumber(0))
  )

  return (
    <Card testID="DepositAndEarningsCard" cardStyle={styles.depositAndEarningCard}>
      <View style={styles.depositAndEarningCardTitleContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.totalDepositAndEarnings')}
          </Text>
          <Touchable onPress={() => Logger.info('Title Icon Pressed!')} borderRadius={24}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <View>
          <Text style={styles.depositAndEarningCardTitleText}>
            {t('earnFlow.poolInfoScreen.titleLocalAmountDisplay', {
              localCurrencySymbol,
              localCurrencyAmount: formatValueToDisplay(totalBalanceInLocalCurrency),
            })}
          </Text>
        </View>
      </View>

      <View style={styles.depositAndEarningCardSubtitleContainer}>
        <View style={styles.cardLineContainer}>
          <View style={styles.cardLineLabel}>
            <Text style={styles.depositAndEarningsCardLabelText}>
              {t('earnFlow.poolInfoScreen.deposit')}
            </Text>
          </View>
          <Text style={styles.depositAndEarningsCardLabelText}>
            {t('earnFlow.poolInfoScreen.lineItemAmountDisplay', {
              localCurrencySymbol,
              localCurrencyAmount: formatValueToDisplay(depositBalanceInLocalCurrency),
              cryptoAmount: formatValueToDisplay(totalBalanceInLocalCurrency),
              cryptoSymbol: tokenInfo?.symbol,
            })}
          </Text>
        </View>
        {earningItems.map((item, index) => (
          <EarningItemLineItem key={index} earnItem={item} />
        ))}
      </View>
    </Card>
  )
}

function YieldCard({
  infoIconPress,
  tokensInfo,
  earnPosition,
}: {
  infoIconPress: () => void
  tokensInfo: TokenBalance[]
  earnPosition: EarnPosition
}) {
  const { t } = useTranslation()
  const yieldRateSum = earnPosition.dataProps.yieldRates
    .map((rate) => rate.percentage)
    .reduce((acc, rate) => acc + rate, 0)

  return (
    <Card testID="YieldCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.yieldRate')}
          </Text>
          <Touchable onPress={infoIconPress} borderRadius={24}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>
          {yieldRateSum > 0
            ? t('earnFlow.poolInfoScreen.ratePercent', { rate: yieldRateSum.toFixed(2) })
            : '--'}
        </Text>
      </View>
      <View style={{ gap: Spacing.Smallest8 }}>
        {earnPosition.dataProps.yieldRates.map((rate, index) => {
          // TODO: investigate how to do when there are multiple tokens in a yield rate
          const tokenInfo = tokensInfo.filter((token) => token.tokenId === rate.tokenId)
          return (
            <View style={styles.cardLineContainer} key={index}>
              <View style={styles.cardLineLabel}>
                <Text style={styles.cardLabelText}>{rate.label}</Text>
                <TokenIcons
                  tokensInfo={tokenInfo}
                  size={IconSize.XXSMALL}
                  showNetworkIcon={false}
                />
              </View>
              <Text style={styles.cardLabelText}>
                {t('earnFlow.poolInfoScreen.ratePercent', { rate: rate.percentage.toFixed(2) })}
              </Text>
            </View>
          )
        })}
      </View>
    </Card>
  )
}

function TvlCard({
  earnPosition,
  infoIconPress,
}: {
  earnPosition: EarnPosition
  infoIconPress: () => void
}) {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { t } = useTranslation()
  const tvl = earnPosition.dataProps.tvl
  const priceUsd = earnPosition.priceUsd
  const tvlInFiat = useDollarsToLocalAmount(
    tvl ? new BigNumber(tvl).times(new BigNumber(priceUsd)) : null
  )
  const tvlString = useMemo(() => {
    return `${localCurrencySymbol}${tvlInFiat ? formatValueToDisplay(tvlInFiat) : '--'}`
  }, [localCurrencySymbol, tvlInFiat])

  return (
    <Card testID="TvlCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.tvl')}
          </Text>
          <Touchable onPress={infoIconPress} borderRadius={24}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>{tvlString}</Text>
      </View>
    </Card>
  )
}

function AgeCard({ ageOfPool, infoIconPress }: { ageOfPool: Date; infoIconPress: () => void }) {
  const { t } = useTranslation()
  const dateInterval: Duration = intervalToDuration({
    start: ageOfPool,
    end: new Date(),
  })

  return (
    <Card testID="AgeCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <Text numberOfLines={1} style={styles.cardTitleText}>
            {t('earnFlow.poolInfoScreen.ageOfPool')}
          </Text>
          <Touchable onPress={infoIconPress} borderRadius={24}>
            <InfoIcon size={16} color={Colors.gray3} />
          </Touchable>
        </View>
        <Text style={styles.cardTitleText}>{formattedDuration(dateInterval)}</Text>
      </View>
    </Card>
  )
}

function LearnMoreTouchable({
  url,
  providerName,
  appId,
  positionId,
}: {
  url: string
  providerName: string
  appId: string
  positionId: string
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.learnMoreContainer}>
      <Touchable
        borderRadius={8}
        onPress={() => {
          AppAnalytics.track(EarnEvents.earn_pool_info_view_pool, {
            appId,
            positionId,
          })
          navigateToURI(url)
        }}
      >
        <View style={styles.learnMoreView}>
          <OpenLinkIcon color={Colors.black} size={24} />
          <Text style={styles.learnMoreText}>
            {t('earnFlow.poolInfoScreen.learnMoreOnProvider', { providerName })}
          </Text>
        </View>
      </Touchable>
    </View>
  )
}

function ActionButtons({ earnPosition }: { earnPosition: EarnPosition }) {
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(bottom, Spacing.Regular16),
  }
  const { t } = useTranslation()
  const { availableShortcutIds } = earnPosition
  const deposit = availableShortcutIds.includes('withdraw')
  const withdraw = availableShortcutIds.includes('withdraw')

  return (
    <View testID="ActionButtons" style={[styles.buttonContainer, insetsStyle]}>
      {withdraw && (
        <Button
          text={t('earnFlow.poolInfoScreen.withdraw')}
          onPress={() => {
            // TODO (ACT-1343): EarnCollectScreen should take earnPosition instead of depositTokenId and poolTokenId and remove Logger.debug
            // navigate(Screens.EarnCollectScreen, { earnPosition })
            Logger.debug('Withdraw Button Pressed!')
          }}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          style={styles.flex}
        />
      )}
      {deposit && (
        <Button
          text={t('earnFlow.poolInfoScreen.deposit')}
          onPress={() => {
            // TODO hook up after ACT-1342 is merged and remove Logger.debug
            // navigate(Screens.EarnEnterAmount, { pool: earnPosition })
            Logger.debug('Deposit Button Pressed!')
          }}
          size={BtnSizes.FULL}
          style={styles.flex}
        />
      )}
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.EarnPoolInfoScreen>

export default function EarnPoolInfoScreen({ route, navigation }: Props) {
  const { pool } = route.params
  const { networkId, tokens, displayProps, appName, dataProps, appId, positionId, balance } = pool
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [tokens, allTokens])

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [titleHeight, setTitleHeight] = useState(0)
  const handleMeasureTitleHeight = (event: LayoutChangeEvent) => {
    setTitleHeight(event.nativeEvent.layout.height)
  }
  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })
  useScrollAwareHeader({
    navigation,
    title: <HeaderTitleSection earnPosition={pool} tokensInfo={tokensInfo} />,
    scrollPosition,
    startFadeInPosition: titleHeight - titleHeight * 0.33,
    animationDistance: titleHeight * 0.33,
  })

  return (
    <SafeAreaView style={styles.flex} edges={[]}>
      <Animated.ScrollView contentContainerStyle={styles.scrollContainer} onScroll={handleScroll}>
        <TitleSection
          title={displayProps.title}
          tokensInfo={tokensInfo}
          providerName={appName}
          networkName={NETWORK_NAMES[networkId]}
          onLayout={handleMeasureTitleHeight}
        />
        <View style={{ height: Spacing.Thick24 }} />
        <View style={styles.contentContainer}>
          {new BigNumber(balance).gt(0) && <DepositAndEarningsCard earnPosition={pool} />}
          <YieldCard
            // TODO(ACT-1323): Create info bottom sheet & remove Logger.debug
            infoIconPress={() => Logger.debug('YieldCard Info Icon Pressed!')}
            tokensInfo={tokensInfo}
            earnPosition={pool}
          />
          <TvlCard
            // TODO(ACT-1323): Create info bottom sheet & remove Logger.debug
            earnPosition={pool}
            infoIconPress={() => Logger.debug(' TvlCard Info Icon Pressed!')}
          />
          {dataProps.contractCreatedAt ? (
            <AgeCard
              // TODO(ACT-1323): Create info bottom sheet & remove Logger.debug
              ageOfPool={new Date(dataProps.contractCreatedAt)}
              infoIconPress={() => Logger.debug('AgeCard Info Icon Pressed!')}
            />
          ) : null}
          {dataProps.manageUrl && appName ? (
            <LearnMoreTouchable
              url={dataProps.manageUrl}
              providerName={appName}
              appId={appId}
              positionId={positionId}
            />
          ) : null}
        </View>
      </Animated.ScrollView>
      <ActionButtons earnPosition={pool} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  headerTitleText: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    padding: Spacing.Thick24,
    ...(Platform.OS === 'android' && {
      minHeight: variables.height,
    }),
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  subtitleLabel: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
  },
  subtitleInfo: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  titleContainer: {
    gap: Spacing.Smallest8,
  },
  subtitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.Thick24,
    rowGap: 0, // Set to Zero to prevent gap between rows when flexWrap is set to wrap
    flexWrap: 'wrap',
  },
  tokenIconsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  contentContainer: {
    gap: Spacing.Regular16,
  },
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Regular16,
  },
  cardLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLineLabel: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    paddingRight: 20, // Prevents Icon from being cut off on long labels
  },
  cardTitleText: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  cardLabelText: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
  },
  depositAndEarningCard: {
    backgroundColor: Colors.gray1,
    padding: 0,
    gap: 0,
  },
  depositAndEarningCardTitleContainer: {
    padding: Spacing.Regular16,
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  depositAndEarningCardTitleText: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  depositAndEarningCardSubtitleContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.Regular16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: Spacing.Smallest8,
  },
  depositAndEarningsCardLabelText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  learnMoreContainer: {
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  learnMoreView: {
    flex: 1,
    gap: Spacing.Tiny4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.Smallest8,
  },
  learnMoreText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  buttonContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
  },
})

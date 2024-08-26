import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { Duration, intervalToDuration } from 'date-fns'
import React, { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
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

function Card({ children, testID }: { children: React.ReactNode; testID: string }) {
  return (
    <View testID={testID} style={styles.card}>
      {children}
    </View>
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
      <View style={{ gap: 8 }}>
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
  manageUrl,
  providerName,
}: {
  manageUrl: string
  providerName: string
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.learnMoreContainer}>
      <Touchable borderRadius={8} onPress={() => navigateToURI(manageUrl)}>
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
    <View style={[styles.buttonContainer, insetsStyle]}>
      {withdraw && (
        <Button
          text={t('earnFlow.poolInfoScreen.withdraw')}
          onPress={() => {
            // TODO (ACT-1343): EarnCollectScreen should take earnPositon instead of depositTokenId and poolTokenId
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
            // TODO hook up after ACT-1342 is merged
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
  const { networkId, tokens, displayProps, appName, dataProps } = pool
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [tokens, allTokens])

  // console.log('Tom - earnPosition.dataProps.yieldRates: ', pool.dataProps.yieldRates)

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
          <YieldCard
            // TODO(ACT-1323): Create info bottom sheet
            infoIconPress={() => Logger.debug('YieldCard Info Icon Pressed!')}
            tokensInfo={tokensInfo}
            earnPosition={pool}
          />
          <TvlCard
            // TODO(ACT-1323): Create info bottom sheet
            earnPosition={pool}
            infoIconPress={() => Logger.debug(' TvlCard Info Icon Pressed!')}
          />
          {dataProps.contractCreatedAt ? (
            <AgeCard
              // TODO(ACT-1323): Create info bottom sheet
              ageOfPool={new Date(Date.now())}
              infoIconPress={() => Logger.debug('AgeCard Info Icon Pressed!')}
            />
          ) : null}
          {dataProps.manageUrl && appName ? (
            <LearnMoreTouchable manageUrl={dataProps.manageUrl} providerName={appName} />
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
    ...typeScale.labelSemiBoldLarge,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleMedium,
  },
  subtitleLabel: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  subtitleInfo: {
    ...typeScale.labelSmall,
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
    gap: 16,
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
    gap: 4,
    alignItems: 'center',
    paddingRight: 20, // Prevents Icon from being cut off on long labels
  },
  cardTitleText: {
    ...typeScale.labelSemiBoldLarge,
    color: Colors.black,
  },
  cardLabelText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
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
    gap: 4,
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

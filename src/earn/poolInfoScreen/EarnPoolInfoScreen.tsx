import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { EarnCommonProperties } from 'src/analytics/Properties'
import { openUrl } from 'src/app/actions'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { useDepositEntrypointInfo } from 'src/earn/hooks'
import BeforeDepositBottomSheet from 'src/earn/poolInfoScreen/BeforeDepositBottomSheet'
import {
  AgeCard,
  DailyYieldRateCard,
  DepositAndEarningsCard,
  TvlCard,
  YieldCard,
} from 'src/earn/poolInfoScreen/Cards'
import { SafetyCard } from 'src/earn/poolInfoScreen/SafetyCard'
import TokenIcons from 'src/earn/poolInfoScreen/TokenIcons'
import WithdrawBottomSheet from 'src/earn/poolInfoScreen/WithdrawBottomSheet'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { positionsWithBalanceSelector } from 'src/positions/selectors'
import { EarnPosition } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { navigateToURI } from 'src/utils/linking'

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

function LearnMoreTouchable({
  url,
  providerName,
  commonAnalyticsProps,
}: {
  url: string
  providerName: string
  commonAnalyticsProps: EarnCommonProperties
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.learnMoreContainer}>
      <Touchable
        borderRadius={8}
        onPress={() => {
          AppAnalytics.track(EarnEvents.earn_pool_info_view_pool, commonAnalyticsProps)
          navigateToURI(url)
        }}
      >
        <View style={styles.learnMoreView}>
          <Text style={styles.learnMoreText}>
            {t('earnFlow.poolInfoScreen.learnMoreOnProvider', { providerName })}
          </Text>
          <OpenLinkIcon color={Colors.black} size={16} />
        </View>
      </Touchable>
    </View>
  )
}

function ActionButtons({
  earnPosition,
  onPressDeposit,
  onPressWithdraw,
}: {
  earnPosition: EarnPosition
  onPressDeposit: () => void
  onPressWithdraw: () => void
}) {
  const { bottom } = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(bottom, Spacing.Regular16),
  }
  const { t } = useTranslation()
  const { availableShortcutIds } = earnPosition
  const deposit = availableShortcutIds.includes('deposit')
  const withdraw =
    availableShortcutIds.includes('withdraw') && new BigNumber(earnPosition.balance).gt(0)

  return (
    <View testID="ActionButtons" style={[styles.buttonContainer, insetsStyle]}>
      {withdraw && (
        <Button
          text={t('earnFlow.poolInfoScreen.withdraw')}
          onPress={onPressWithdraw}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          style={styles.flex}
          testID="WithdrawButton"
        />
      )}
      {deposit && (
        <Button
          text={t('earnFlow.poolInfoScreen.deposit')}
          onPress={onPressDeposit}
          size={BtnSizes.FULL}
          style={styles.flex}
          testID="DepositButton"
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

  const depositToken = allTokens[dataProps.depositTokenId]
  if (!depositToken) {
    // This should never happen
    throw new Error(`Token ${dataProps.depositTokenId} not found`)
  }

  const commonAnalyticsProps: EarnCommonProperties = {
    providerId: appId,
    poolId: positionId,
    networkId,
    depositTokenId: dataProps.depositTokenId,
  }

  const {
    hasDepositToken,
    hasTokensOnSameNetwork,
    hasTokensOnOtherNetworks,
    canCashIn,
    exchanges,
  } = useDepositEntrypointInfo({ allTokens, pool })

  const allPositionsWithBalance = useSelector(positionsWithBalanceSelector)

  const hasRewards = useMemo(() => {
    const rewardsPositions = allPositionsWithBalance.filter((position) =>
      pool.dataProps.rewardsPositionIds?.includes(position.positionId)
    )
    return rewardsPositions.length > 0
  }, [allPositionsWithBalance])

  const onPressWithdraw = () => {
    AppAnalytics.track(EarnEvents.earn_pool_info_tap_withdraw, {
      poolId: positionId,
      providerId: appId,
      poolAmount: balance,
      networkId,
      depositTokenId: dataProps.depositTokenId,
    })
    const partialWithdrawalsEnabled = getFeatureGate(
      StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL
    )
    if (hasRewards || partialWithdrawalsEnabled) {
      withdrawBottomSheetRef.current?.snapToIndex(0)
    } else {
      navigate(Screens.EarnCollectScreen, { pool }) // TODO (ACT-1389): Confirmation screen for Claim & Withdraw
    }
  }

  const onPressDeposit = () => {
    AppAnalytics.track(EarnEvents.earn_pool_info_tap_deposit, {
      ...commonAnalyticsProps,
      hasDepositToken,
      hasTokensOnSameNetwork,
      hasTokensOnOtherNetworks,
    })
    if (hasDepositToken) {
      navigate(Screens.EarnEnterAmount, { pool })
    } else {
      beforeDepositBottomSheetRef.current?.snapToIndex(0)
    }
  }

  const beforeDepositBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const depositInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const tvlInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const ageInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const yieldRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const withdrawBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const dailyYieldRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const safetyScoreInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)

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
          {new BigNumber(balance).gt(0) && (
            <DepositAndEarningsCard
              earnPosition={pool}
              onInfoIconPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                  type: 'deposit',
                  ...commonAnalyticsProps,
                })
                depositInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          )}
          <YieldCard
            onInfoIconPress={() => {
              AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                type: 'yieldRate',
                ...commonAnalyticsProps,
              })
              yieldRateInfoBottomSheetRef.current?.snapToIndex(0)
            }}
            tokensInfo={tokensInfo}
            earnPosition={pool}
          />
          {!!dataProps.dailyYieldRatePercentage && dataProps.dailyYieldRatePercentage > 0 && (
            <DailyYieldRateCard
              dailyYieldRate={dataProps.dailyYieldRatePercentage}
              onInfoIconPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                  type: 'dailyYieldRate',
                  ...commonAnalyticsProps,
                })
                dailyYieldRateInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          )}
          {!!dataProps.safety && (
            <SafetyCard
              safety={dataProps.safety}
              commonAnalyticsProps={commonAnalyticsProps}
              onInfoIconPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                  type: 'safetyScore',
                  ...commonAnalyticsProps,
                })
                safetyScoreInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          )}
          <TvlCard
            earnPosition={pool}
            onInfoIconPress={() => {
              AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                type: 'tvl',
                ...commonAnalyticsProps,
              })
              tvlInfoBottomSheetRef.current?.snapToIndex(0)
            }}
          />
          {dataProps.contractCreatedAt ? (
            <AgeCard
              ageOfPool={new Date(dataProps.contractCreatedAt)}
              onInfoIconPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                  type: 'age',
                  ...commonAnalyticsProps,
                })
                ageInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          ) : null}
          {dataProps.manageUrl && appName ? (
            <LearnMoreTouchable
              url={dataProps.manageUrl}
              providerName={appName}
              commonAnalyticsProps={commonAnalyticsProps}
            />
          ) : null}
        </View>
      </Animated.ScrollView>
      <ActionButtons
        earnPosition={pool}
        onPressDeposit={onPressDeposit}
        onPressWithdraw={onPressWithdraw}
      />
      <InfoBottomSheet
        infoBottomSheetRef={depositInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.depositAndEarnings"
        descriptionKey={
          dataProps.cantSeparateCompoundedInterest
            ? 'earnFlow.poolInfoScreen.infoBottomSheet.depositNoBreakdownDescription'
            : 'earnFlow.poolInfoScreen.infoBottomSheet.depositDescription'
        }
        providerName={appName}
        testId="DepositInfoBottomSheet"
      />
      <InfoBottomSheet
        infoBottomSheetRef={tvlInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.infoBottomSheet.tvlTitle"
        descriptionKey="earnFlow.poolInfoScreen.infoBottomSheet.tvlDescription"
        providerName={appName}
        testId="TvlInfoBottomSheet"
      />
      <InfoBottomSheet
        infoBottomSheetRef={ageInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.infoBottomSheet.ageTitle"
        descriptionKey="earnFlow.poolInfoScreen.infoBottomSheet.ageDescription"
        providerName={appName}
        testId="AgeInfoBottomSheet"
      />
      <InfoBottomSheet
        infoBottomSheetRef={yieldRateInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.infoBottomSheet.yieldRateTitle"
        descriptionKey="earnFlow.poolInfoScreen.infoBottomSheet.yieldRateDescription"
        descriptionUrl={dataProps.manageUrl}
        providerName={appName}
        testId="YieldRateInfoBottomSheet"
      />
      <InfoBottomSheet
        infoBottomSheetRef={dailyYieldRateInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.infoBottomSheet.dailyYieldRateTitle"
        descriptionKey="earnFlow.poolInfoScreen.infoBottomSheet.dailyYieldRateDescription"
        descriptionUrl={dataProps.manageUrl}
        providerName={appName}
        linkKey="earnFlow.poolInfoScreen.infoBottomSheet.dailyYieldRateLink"
        linkUrl={dataProps.manageUrl}
        testId="DailyYieldRateInfoBottomSheet"
      />
      <InfoBottomSheet
        infoBottomSheetRef={safetyScoreInfoBottomSheetRef}
        titleKey="earnFlow.poolInfoScreen.infoBottomSheet.safetyScoreTitle"
        descriptionKey="earnFlow.poolInfoScreen.infoBottomSheet.safetyScoreDescription"
        providerName={appName}
        linkKey="earnFlow.poolInfoScreen.infoBottomSheet.safetyScoreRateLink"
        linkUrl={dataProps.manageUrl}
        testId="SafetyScoreInfoBottomSheet"
      />
      <BeforeDepositBottomSheet
        forwardedRef={beforeDepositBottomSheetRef}
        token={depositToken}
        pool={pool}
        hasTokensOnSameNetwork={hasTokensOnSameNetwork}
        hasTokensOnOtherNetworks={hasTokensOnOtherNetworks}
        canAdd={canCashIn}
        exchanges={exchanges}
      />
      <WithdrawBottomSheet
        forwardedRef={withdrawBottomSheetRef}
        pool={pool}
        canClaim={hasRewards}
      />
    </SafeAreaView>
  )
}

function InfoBottomSheet({
  infoBottomSheetRef,
  titleKey,
  descriptionKey,
  descriptionUrl,
  providerName,
  testId,
  linkUrl,
  linkKey,
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetModalRefType>
  titleKey: string
  descriptionKey: string
  descriptionUrl?: string
  providerName: string
  testId: string
  linkUrl?: string
  linkKey?: string
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }

  const onPressUrl = () => {
    descriptionUrl && dispatch(openUrl(descriptionUrl, true))
  }

  return (
    <BottomSheet
      forwardedRef={infoBottomSheetRef}
      title={t(titleKey)}
      testId={testId}
      titleStyle={styles.infoBottomSheetTitle}
    >
      {descriptionUrl ? (
        <Text style={styles.infoBottomSheetText}>
          <Trans i18nKey={descriptionKey} tOptions={{ providerName }}>
            <Text onPress={onPressUrl} style={styles.linkText} />
          </Trans>
        </Text>
      ) : (
        <Text style={styles.infoBottomSheetText}>{t(descriptionKey, { providerName })}</Text>
      )}
      {!!linkUrl && !!linkKey && (
        <View style={styles.learnMoreContainer}>
          <Touchable
            borderRadius={8}
            onPress={() => {
              navigateToURI(linkUrl)
            }}
          >
            <View style={styles.learnMoreView}>
              <Text style={styles.learnMoreText}>
                <Trans i18nKey={linkKey} tOptions={{ providerName }} />
              </Text>
              <OpenLinkIcon color={Colors.black} size={16} />
            </View>
          </Touchable>
        </View>
      )}
      <Button
        onPress={onPressDismiss}
        text={t('earnFlow.poolInfoScreen.infoBottomSheet.gotIt')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
      />
    </BottomSheet>
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
  contentContainer: {
    gap: Spacing.Regular16,
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
    marginBottom: Spacing.Thick24,
  },
  learnMoreText: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  buttonContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    padding: Spacing.Regular16,
    gap: Spacing.Smallest8,
  },
  infoBottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  infoBottomSheetText: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Thick24,
    color: Colors.black,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
})

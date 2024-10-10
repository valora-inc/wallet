import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { Duration, intervalToDuration } from 'date-fns'
import React, { useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { openUrl } from 'src/app/actions'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import BeforeDepositBottomSheet from 'src/earn/BeforeDepositBottomSheet'
import { useDepositEntrypointInfo } from 'src/earn/hooks'
import WithdrawBottomSheet from 'src/earn/WithdrawBottomSheet'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import type { EarningItem } from 'src/positions/types'
import { EarnPosition } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo, useTokensInfo } from 'src/tokens/hooks'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
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
    <View testID="EarningItemLineItem" style={styles.cardLineContainer}>
      <View style={styles.cardLineLabel}>
        <Text numberOfLines={1} style={styles.depositAndEarningsCardLabelText}>
          {earnItem.label}
        </Text>
      </View>
      <View style={styles.flexShrink}>
        <Text style={styles.depositAndEarningsCardValueText}>
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

function DepositAndEarningsCard({
  earnPosition,
  onInfoIconPress,
}: {
  earnPosition: EarnPosition
  onInfoIconPress: () => void
}) {
  const { t } = useTranslation()
  const { balance, priceUsd, pricePerShare } = earnPosition
  const { earningItems, depositTokenId, cantSeparateCompoundedInterest } = earnPosition.dataProps
  const depositTokenInfo = useTokenInfo(depositTokenId)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  // Deposit items used to calculate the total balance and total deposited
  const depositBalanceInUsd = new BigNumber(priceUsd).multipliedBy(balance)
  const depositBalanceInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    depositBalanceInUsd ?? 0
  )

  // Earning items used to calculate the total balance and total deposited
  const earningItemsTokenIds = earningItems.map((item) => item.tokenId)
  const earningItemsTokenInfo = useTokensInfo(earningItemsTokenIds)

  const totalBalanceInLocalCurrency = useMemo(() => {
    return depositBalanceInLocalCurrency.plus(
      earningItems
        .filter((item) => !item.includedInPoolBalance)
        .reduce((acc, item) => {
          const tokenInfo = earningItemsTokenInfo.find((token) => token?.tokenId === item.tokenId)
          const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(item.amount)
          const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
            amountInUsd ?? 0
          )
          return acc.plus(amountInLocalCurrency ?? 0)
        }, new BigNumber(0))
    )
  }, [
    depositBalanceInLocalCurrency,
    earningItems,
    earningItemsTokenInfo,
    localCurrencyExchangeRate,
  ])

  const totalDepositBalanceInCrypto = useMemo(() => {
    return new BigNumber(balance).multipliedBy(new BigNumber(pricePerShare[0]) ?? 1).minus(
      earningItems
        .filter((item) => item.includedInPoolBalance)
        .reduce((acc, item) => {
          const tokenInfo = earningItemsTokenInfo.find((token) => token?.tokenId === item.tokenId)
          return acc.plus(
            new BigNumber(item.amount)
              .multipliedBy(tokenInfo?.priceUsd ?? 0)
              .dividedBy(depositTokenInfo?.priceUsd ?? 1)
          )
        }, new BigNumber(0))
    )
  }, [balance, pricePerShare, earningItems, earningItemsTokenInfo, depositTokenInfo])

  const totalDepositBalanceInLocalCurrency =
    useDollarsToLocalAmount(
      totalDepositBalanceInCrypto.multipliedBy(depositTokenInfo?.priceUsd ?? 0)
    ) ?? new BigNumber(0)

  return (
    <View testID="DepositAndEarningsCard" style={[styles.card, styles.depositAndEarningCard]}>
      <View style={styles.depositAndEarningCardTitleContainer}>
        <LabelWithInfo
          onPress={onInfoIconPress}
          label={t('earnFlow.poolInfoScreen.totalDepositAndEarnings')}
          labelStyle={styles.cardTitleText}
          testID={'DepositInfoIcon'}
        />
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
            {cantSeparateCompoundedInterest ? (
              <Text style={styles.depositAndEarningsCardLabelText}>
                {t('earnFlow.poolInfoScreen.depositAndEarnings')}
              </Text>
            ) : (
              <Text style={styles.depositAndEarningsCardLabelText}>
                {t('earnFlow.poolInfoScreen.deposit')}
              </Text>
            )}
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.depositAndEarningsCardValueText}>
              {t('earnFlow.poolInfoScreen.lineItemAmountDisplay', {
                localCurrencySymbol,
                localCurrencyAmount: formatValueToDisplay(totalDepositBalanceInLocalCurrency),
                cryptoAmount: formatValueToDisplay(totalDepositBalanceInCrypto),
                cryptoSymbol: depositTokenInfo?.symbol,
              })}
            </Text>
          </View>
        </View>
        {earningItems.map((item, index) => (
          <EarningItemLineItem key={index} earnItem={item} />
        ))}
      </View>
    </View>
  )
}

function YieldCard({
  onInfoIconPress,
  tokensInfo,
  earnPosition,
}: {
  onInfoIconPress: () => void
  tokensInfo: TokenBalance[]
  earnPosition: EarnPosition
}) {
  const { t } = useTranslation()
  const yieldRateSum = earnPosition.dataProps.yieldRates
    .map((rate) => rate.percentage)
    .reduce((acc, rate) => acc + rate, 0)

  return (
    <View style={styles.card} testID="YieldCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.yieldRate')}
            labelStyle={styles.cardTitleText}
            testID="YieldRateInfoIcon"
          />
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
                <Text numberOfLines={1} style={styles.cardLabelText}>
                  {rate.label}
                </Text>
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
    </View>
  )
}

function TvlCard({
  earnPosition,
  onInfoIconPress,
}: {
  earnPosition: EarnPosition
  onInfoIconPress: () => void
}) {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { t } = useTranslation()
  const tvl = earnPosition.dataProps.tvl
  const tvlInFiat = useDollarsToLocalAmount(tvl ?? null)
  const tvlString = useMemo(() => {
    return `${localCurrencySymbol}${tvlInFiat ? formatValueToDisplay(tvlInFiat) : '--'}`
  }, [localCurrencySymbol, tvlInFiat])

  return (
    <View style={styles.card} testID="TvlCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.tvl')}
            labelStyle={styles.cardTitleText}
            testID="TvlInfoIcon"
          />
        </View>
        <Text style={styles.cardTitleText}>{tvlString}</Text>
      </View>
    </View>
  )
}

function AgeCard({ ageOfPool, onInfoIconPress }: { ageOfPool: Date; onInfoIconPress: () => void }) {
  const { t } = useTranslation()
  const dateInterval: Duration = intervalToDuration({
    start: ageOfPool,
    end: new Date(),
  })

  return (
    <View style={styles.card} testID="AgeCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.cardLineLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.ageOfPool')}
            labelStyle={styles.cardTitleText}
            testID="AgeInfoIcon"
          />
        </View>
        <Text style={styles.cardTitleText}>{formattedDuration(dateInterval)}</Text>
      </View>
    </View>
  )
}

function LearnMoreTouchable({
  url,
  providerName,
  appId,
  positionId,
  networkId,
  depositTokenId,
}: {
  url: string
  providerName: string
  appId: string
  positionId: string
  networkId: NetworkId
  depositTokenId: string
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.learnMoreContainer}>
      <Touchable
        borderRadius={8}
        onPress={() => {
          AppAnalytics.track(EarnEvents.earn_pool_info_view_pool, {
            providerId: appId,
            poolId: positionId,
            networkId,
            depositTokenId,
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

function ActionButtons({
  earnPosition,
  onPressDeposit,
}: {
  earnPosition: EarnPosition
  onPressDeposit: () => void
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
          onPress={() => {
            AppAnalytics.track(EarnEvents.earn_pool_info_tap_withdraw, {
              poolId: earnPosition.positionId,
              providerId: earnPosition.appId,
              poolAmount: earnPosition.balance,
              networkId: earnPosition.networkId,
              depositTokenId: earnPosition.dataProps.depositTokenId,
            })
            navigate(Screens.EarnCollectScreen, { pool: earnPosition })
          }}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          style={styles.flex}
        />
      )}
      {deposit && (
        <Button
          text={t('earnFlow.poolInfoScreen.deposit')}
          onPress={onPressDeposit}
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

  const depositToken = allTokens[dataProps.depositTokenId]
  if (!depositToken) {
    // This should never happen
    throw new Error(`Token ${dataProps.depositTokenId} not found`)
  }

  const {
    hasDepositToken,
    hasTokensOnSameNetwork,
    hasTokensOnOtherNetworks,
    canCashIn,
    exchanges,
  } = useDepositEntrypointInfo({ allTokens, pool })

  const onPressDeposit = () => {
    AppAnalytics.track(EarnEvents.earn_pool_info_tap_deposit, {
      poolId: positionId,
      providerId: appId,
      networkId: networkId,
      depositTokenId: dataProps.depositTokenId,
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

  // TODO: update onPressWithdraw to either open the bottom sheet or navigate if only 1 option

  const beforeDepositBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const depositInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const tvlInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const ageInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const yieldRateInfoBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const withdrawBottomSheetRef = useRef<BottomSheetModalRefType>(null)

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
                  providerId: appId,
                  poolId: positionId,
                  type: 'deposit',
                  networkId,
                  depositTokenId: dataProps.depositTokenId,
                })
                depositInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          )}
          <YieldCard
            onInfoIconPress={() => {
              AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                providerId: appId,
                poolId: positionId,
                type: 'yieldRate',
                networkId,
                depositTokenId: dataProps.depositTokenId,
              })
              yieldRateInfoBottomSheetRef.current?.snapToIndex(0)
            }}
            tokensInfo={tokensInfo}
            earnPosition={pool}
          />
          <TvlCard
            earnPosition={pool}
            onInfoIconPress={() => {
              AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                providerId: appId,
                poolId: positionId,
                type: 'tvl',
                networkId,
                depositTokenId: dataProps.depositTokenId,
              })
              tvlInfoBottomSheetRef.current?.snapToIndex(0)
            }}
          />
          {dataProps.contractCreatedAt ? (
            <AgeCard
              ageOfPool={new Date(dataProps.contractCreatedAt)}
              onInfoIconPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_info_tap_info_icon, {
                  providerId: appId,
                  poolId: positionId,
                  type: 'age',
                  networkId,
                  depositTokenId: dataProps.depositTokenId,
                })
                ageInfoBottomSheetRef.current?.snapToIndex(0)
              }}
            />
          ) : null}
          {dataProps.manageUrl && appName ? (
            <LearnMoreTouchable
              url={dataProps.manageUrl}
              providerName={appName}
              appId={appId}
              positionId={positionId}
              networkId={networkId}
              depositTokenId={dataProps.depositTokenId}
            />
          ) : null}
        </View>
      </Animated.ScrollView>
      <ActionButtons earnPosition={pool} onPressDeposit={onPressDeposit} />
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
      <BeforeDepositBottomSheet
        forwardedRef={beforeDepositBottomSheetRef}
        token={depositToken}
        pool={pool}
        hasTokensOnSameNetwork={hasTokensOnSameNetwork}
        hasTokensOnOtherNetworks={hasTokensOnOtherNetworks}
        canAdd={canCashIn}
        exchanges={exchanges}
      />
      <WithdrawBottomSheet forwardedRef={withdrawBottomSheetRef} pool={pool} />
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
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetModalRefType>
  titleKey: string
  descriptionKey: string
  descriptionUrl?: string
  providerName: string
  testId: string
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
  flexShrink: {
    flexShrink: 1,
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
    minWidth: '35%',
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
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  depositAndEarningsCardValueText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
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

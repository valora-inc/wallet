import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import _ from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { showMessage } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { AppState } from 'src/app/actions'
import { appStateSelector, phoneNumberVerifiedSelector } from 'src/app/selectors'
import { getAppConfig } from 'src/appConfig'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import {
  ALERT_BANNER_DURATION,
  DEFAULT_TESTNET,
  SHOW_TESTNET_BANNER,
  TIME_UNTIL_TOKEN_INFO_BECOMES_STALE,
} from 'src/config'
import EarnTabBar from 'src/earn/EarnTabBar'
import PoolList from 'src/earn/PoolList'
import { EarnTabType } from 'src/earn/types'
import { refreshAllBalances, visitHome } from 'src/home/actions'
import AttentionIcon from 'src/icons/Attention'
import { importContacts } from 'src/identity/actions'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { refreshPositions } from 'src/positions/actions'
import {
  earnPositionsSelector,
  positionsFetchedAtSelector,
  positionsStatusSelector,
} from 'src/positions/selectors'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { initializeSentryUserContext } from 'src/sentry/actions'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { getShadowStyle, Shadow, Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { hasGrantedContactsPermission } from 'src/utils/contacts'

type Props = NativeStackScreenProps<StackParamList, Screens.TabEarn>

function TabHome({ navigation, route }: Props) {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector(phoneNumberVerifiedSelector)

  const dispatch = useDispatch()

  const pools = useSelector(earnPositionsSelector)

  const activeTab = route.params?.activeEarnTab ?? EarnTabType.AllPools

  const insets = useSafeAreaInsets()

  const supportedNetworkIds = [...new Set(pools.map((pool) => pool.networkId))]
  const allTokens = useSelector((state) => tokensByIdSelector(state, supportedNetworkIds))

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0) {
      return {
        shadowColor: 'transparent',
        transform: [
          {
            translateY: -scrollPosition.value,
          },
        ],
      }
    }

    return {
      transform: [
        {
          translateY:
            scrollPosition.value > nonStickyHeaderHeight
              ? -nonStickyHeaderHeight
              : -scrollPosition.value,
        },
      ],
      shadowColor: interpolateColor(
        scrollPosition.value,
        [nonStickyHeaderHeight - 10, nonStickyHeaderHeight + 10],
        ['transparent', Colors.backgroundPrimary]
      ),
    }
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const learnMoreBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  useEffect(() => {
    dispatch(visitHome())
  }, [])

  const showTestnetBanner = () => {
    dispatch(
      showMessage(
        t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
        ALERT_BANNER_DURATION,
        null,
        null,
        t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
      )
    )
  }

  const tryImportContacts = async () => {
    // Skip if contacts have already been imported or the user hasn't verified their phone number.
    if (Object.keys(recipientCache).length || !isNumberVerified) {
      return
    }

    const contactPermissionStatusGranted = await hasGrantedContactsPermission()
    if (contactPermissionStatusGranted) {
      dispatch(importContacts())
    }
  }

  useEffect(() => {
    // TODO find a better home for this, its unrelated to wallet home
    dispatch(initializeSentryUserContext())
    if (SHOW_TESTNET_BANNER) {
      showTestnetBanner()
    }

    // Waiting 1/2 sec before triggering to allow
    // rest of feed to load unencumbered
    setTimeout(tryImportContacts, 500)
  }, [])

  useEffect(() => {
    if (appState === AppState.Active) {
      dispatch(refreshAllBalances())
    }
  }, [appState])

  const tokens = [...new Set(pools.flatMap((pool) => pool.tokens))]

  const tokenList = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [allTokens])

  const handleMeasureListHeadereHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleChangeActiveView = (selectedTab: EarnTabType) => {
    navigation.setParams({ activeEarnTab: selectedTab })
  }

  const displayPools = useMemo(() => {
    const returnPools =
      activeTab === EarnTabType.AllPools
        ? pools
        : pools.filter(
            (pool) =>
              new BigNumber(pool.balance).gt(0) && !!allTokens[pool.dataProps.depositTokenId]
          )
    return returnPools.filter((pool) =>
      pool.tokens.some((poolToken) =>
        tokenList.map((token) => token.tokenId).includes(poolToken.tokenId)
      )
    )
  }, [pools, allTokens, activeTab, tokenList])

  const onPressLearnMore = () => {
    AppAnalytics.track(EarnEvents.earn_home_learn_more_press)
    learnMoreBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressTryAgain = () => {
    AppAnalytics.track(EarnEvents.earn_home_error_try_again)
    dispatch(refreshPositions())
  }

  const positionsStatus = useSelector(positionsStatusSelector)
  const positionsFetchedAt = useSelector(positionsFetchedAtSelector)
  const errorLoadingPools =
    positionsStatus === 'error' &&
    (pools.length === 0 ||
      Date.now() - (positionsFetchedAt ?? 0) > TIME_UNTIL_TOKEN_INFO_BECOMES_STALE)

  const zeroPoolsInMyPoolsTab =
    !errorLoadingPools && displayPools.length === 0 && activeTab === EarnTabType.MyPools

  const assetsConfig = getAppConfig().themes?.default?.assets
  const NoPoolsLogo = assetsConfig?.noEarnPoolsLogo

  return (
    <>
      <Animated.View testID="Home" style={styles.container}>
        <Animated.View
          style={[styles.listHeaderContainer, animatedListHeaderStyles]}
          onLayout={handleMeasureListHeadereHeight}
        >
          <View
            style={[styles.nonStickyHeaderContainer]}
            onLayout={handleMeasureNonStickyHeaderHeight}
          >
            <EarnTabBar activeTab={activeTab} onChange={handleChangeActiveView} />
          </View>
        </Animated.View>
        {errorLoadingPools && (
          <View style={styles.textContainerError}>
            <View style={{ alignItems: 'center' }}>
              <AttentionIcon size={48} color={Colors.warningPrimary} />
            </View>
            <Text style={styles.errorTitle}>{t('earnFlow.home.errorTitle')}</Text>
            <Text style={styles.description}>{t('earnFlow.home.errorDescription')}</Text>
            <Button
              onPress={onPressTryAgain}
              text={t('earnFlow.home.errorButton')}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
            />
          </View>
        )}
        {zeroPoolsInMyPoolsTab && (
          <View style={styles.textContainer}>
            {!!NoPoolsLogo && <NoPoolsLogo />}
            <Text style={styles.noPoolsTitle}>{t('earnFlow.home.noPoolsTitle')}</Text>
            <Text style={styles.description}>{t('earnFlow.home.noPoolsDescription')}</Text>
          </View>
        )}
        {!errorLoadingPools && !zeroPoolsInMyPoolsTab && (
          <PoolList
            handleScroll={handleScroll}
            listHeaderHeight={listHeaderHeight}
            paddingBottom={insets.bottom}
            displayPools={displayPools}
            onPressLearnMore={onPressLearnMore}
          />
        )}
      </Animated.View>
      <LearnMoreBottomSheet learnMoreBottomSheetRef={learnMoreBottomSheetRef} />
    </>
  )
}

function LearnMoreBottomSheet({
  learnMoreBottomSheetRef,
}: {
  learnMoreBottomSheetRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      forwardedRef={learnMoreBottomSheetRef}
      title={t('earnFlow.home.learnMoreBottomSheet.bottomSheetTitle')}
      testId={'Earn/Home/LearnMoreBottomSheet'}
      titleStyle={styles.learnMoreTitle}
    >
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.yieldPoolSubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.yieldPoolDescription')}
      </Text>
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.chooseSubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.chooseDescription')}
      </Text>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    paddingHorizontal: Spacing.Regular16,
    backgroundColor: Colors.backgroundPrimary,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  nonStickyHeaderContainer: {
    paddingTop: Spacing.Regular16,
    zIndex: 1,
    gap: Spacing.Thick24,
    flexDirection: 'column',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Thick24,
    backgroundColor: Colors.backgroundPrimary,
  },
  textContainerError: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.Thick24,
    backgroundColor: Colors.backgroundPrimary,
  },
  noPoolsTitle: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
  },
  errorTitle: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    marginTop: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    textAlign: 'center',
    marginVertical: Spacing.Regular16,
  },
  learnMoreTitle: {
    ...typeScale.titleSmall,
  },
  learnMoreSubTitle: {
    ...typeScale.labelSemiBoldSmall,
    marginBottom: Spacing.Tiny4,
  },
  learnMoreDescription: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Thick24,
  },
})

export default TabHome

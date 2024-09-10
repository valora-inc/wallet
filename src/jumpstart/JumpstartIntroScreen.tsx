import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import AddAssetsBottomSheet, { type AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import BackButton from 'src/components/BackButton'
import { type BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader, { CUSTOM_HEADER_HEIGHT } from 'src/components/header/CustomHeader'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import PalmSharp from 'src/images/PalmSharp'
import WaveCurve from 'src/images/WaveCurve'
import { jumpstartIntroHasBeenSeenSelector } from 'src/jumpstart/selectors'
import { jumpstartIntroSeen } from 'src/jumpstart/slice'
import { navigate, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { type StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'
import { TokenActionName } from 'src/tokens/types'
import networkConfig from 'src/web3/networkConfig'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartIntroScreen>

/**
 * The component is set up to follow specific conditions:
 *  - if user has no assets – ALWAYS SHOW intro
 *  - if user has any assets but intro screen hasn't been seen – SHOW intro
 *  - if user has any assets and has already seen intro screen –
 *    this screen should be skipped in favor of JumpstartEnterAmount
 */
export default function JumpstartIntroScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const addAssetsBottomSheetRef = useRef<BottomSheetRefType>(null)

  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const introSeen = useSelector(jumpstartIntroHasBeenSeenSelector)
  const tokens = useSelector(jumpstartSendTokensSelector)
  const noTokens = !tokens.length
  const addAssetsActions: AddAssetsAction[] = [
    {
      name: TokenActionName.Add,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.add'),
      onPress: () => {
        AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
          action: TokenActionName.Add,
        })
        navigate(Screens.FiatExchangeCurrencyBottomSheet, {
          flow: FiatExchangeFlow.CashIn,
          networkId: networkConfig.defaultNetworkId,
        })
      },
    },
    {
      name: TokenActionName.Transfer,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.transfer'),
      onPress: () => {
        AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
          action: TokenActionName.Transfer,
        })
        navigate(Screens.ExchangeQR, {
          flow: CICOFlow.CashIn,
        })
      },
    },
    ...(isSwapEnabled
      ? [
          {
            name: TokenActionName.Swap as const,
            details: t('jumpstartIntro.addFundsCelo.actionDescriptions.swap'),
            onPress: () => {
              AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
                action: TokenActionName.Swap,
              })
              navigate(Screens.SwapScreenWithBack, {
                toTokenNetworkId: networkConfig.defaultNetworkId,
              })
            },
          },
        ]
      : []),
  ]

  const onButtonClick = () => {
    if (noTokens) {
      AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_show_actions)
      addAssetsBottomSheetRef.current?.snapToIndex(0)
      return
    }

    replace(Screens.JumpstartEnterAmount)
  }

  // Track back button click
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      AppAnalytics.track(JumpstartEvents.jumpstart_intro_back)
    })

    return unsubscribe
  }, [navigation])

  // Whenever user sees intro screen for the first time – store the flag in redux and track it in analytics
  useEffect(() => {
    if (!introSeen) {
      AppAnalytics.track(JumpstartEvents.jumpstart_intro_seen)
      dispatch(jumpstartIntroSeen())
    }
  }, [introSeen, dispatch])

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <PalmSharp style={styles.palmImage} />
      <WaveCurve style={styles.waveImage} />
      <CustomHeader style={styles.header} left={<BackButton />} />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>{t('jumpstartIntro.title')}</Text>

        <View style={styles.description}>
          <Text style={styles.descriptionLine}>{t('jumpstartIntro.infoLine1')}</Text>
          {noTokens && <Text style={styles.descriptionLine}>{t('jumpstartIntro.infoLine2')}</Text>}
        </View>

        <Button
          onPress={onButtonClick}
          text={
            noTokens ? t('jumpstartIntro.addFundsCelo.cta') : t('jumpstartIntro.haveFundsButton')
          }
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
        />
      </ScrollView>

      {noTokens && (
        <AddAssetsBottomSheet
          forwardedRef={addAssetsBottomSheetRef}
          title={t('jumpstartIntro.addFundsCelo.title')}
          description={t('jumpstartIntro.addFundsCelo.description')}
          actions={addAssetsActions}
          testId="Jumpstart/addFundsCeloBottomSheet"
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  container: {
    paddingHorizontal: Spacing.Thick24,
    flex: 1,
    gap: Spacing.Regular16,
    justifyContent: 'center',
    marginTop: -CUSTOM_HEADER_HEIGHT,
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
    textAlign: 'center',
  },
  description: {
    gap: 4,
  },
  descriptionLine: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  palmImage: {
    position: 'absolute',
    top: 0,
    right: 20,
  },
  waveImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
})

import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import AddAssetsBottomSheet, { AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import BackButton from 'src/components/BackButton'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader, { CUSTOM_HEADER_HEIGHT } from 'src/components/header/CustomHeader'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import Leaf from 'src/images/Leaf'
import WaveCurve from 'src/images/WaveCurve'
import { jumpstartIntroSeen } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'
import { TokenActionName } from 'src/tokens/types'
import networkConfig from 'src/web3/networkConfig'

export default function JumpstartIntro() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const addAssetsBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const tokens = useSelector(jumpstartSendTokensSelector)
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const noTokens = tokens.length === 0

  // Track in analytics whenever user sees the intro
  useEffect(() => {
    AppAnalytics.track(JumpstartEvents.jumpstart_intro_seen)
  }, [])

  const handleShowAddFunds = () => {
    AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_show_actions)
    addAssetsBottomSheetRef.current?.snapToIndex(0)
  }

  const onIntroDismiss = () => {
    dispatch(jumpstartIntroSeen())
  }

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

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <Leaf style={styles.palmImage} />
      <WaveCurve style={styles.waveImage} />
      <CustomHeader style={styles.header} left={<BackButton />} />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>{t('jumpstartIntro.title')}</Text>

        <View style={styles.description}>
          <Text style={styles.descriptionLine}>{t('jumpstartIntro.description')}</Text>
          {noTokens && (
            <Text style={styles.descriptionLine}>{t('jumpstartIntro.noFundsHint')}</Text>
          )}
        </View>

        <Button
          testID={
            noTokens ? 'JumpstartIntro/noFundsButton' : 'JumpstartEnterAmount/haveFundsButton'
          }
          text={
            noTokens ? t('jumpstartIntro.addFundsCelo.cta') : t('jumpstartIntro.haveFundsButton')
          }
          onPress={noTokens ? handleShowAddFunds : onIntroDismiss}
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

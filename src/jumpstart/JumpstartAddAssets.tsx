import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AddAssetsBottomSheet, { AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import BackButton from 'src/components/BackButton'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader from 'src/components/header/CustomHeader'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import Palm from 'src/icons/Palm'
import WaveCurve from 'src/icons/WaveCurve'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenActionName } from 'src/tokens/types'

export default function JumpstartAddAssets() {
  const addAssetsBottomSheetRef = useRef<BottomSheetRefType>(null)

  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)

  const handleShowAddFunds = () => {
    // TODO analytics
    addAssetsBottomSheetRef.current?.snapToIndex(0)
  }

  const addAssetsActions: AddAssetsAction[] = [
    {
      name: TokenActionName.Add,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.add'),
      onPress: () => {
        // TODO analytics
        navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
      },
    },
    {
      name: TokenActionName.Transfer,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.transfer'),
      onPress: () => {
        // TODO analytics
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
              // TODO analytics
              navigate(Screens.SwapScreenWithBack)
            },
          },
        ]
      : []),
  ]

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <Palm style={styles.palmImage} />
      <WaveCurve style={styles.waveImage} />
      <CustomHeader style={styles.header} left={<BackButton />} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>{t('jumpstartIntro.title')}</Text>
        <Text style={styles.description}>{t('jumpstartIntro.addFundsCelo.info')}</Text>

        <Button
          onPress={handleShowAddFunds}
          text={t('jumpstartIntro.addFundsCelo.cta')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
        />
      </ScrollView>

      <AddAssetsBottomSheet
        forwardedRef={addAssetsBottomSheetRef}
        title={t('jumpstartIntro.addFundsCelo.title')}
        description={t('jumpstartIntro.addFundsCelo.description')}
        actions={addAssetsActions}
        testId="Jumpstart/addFundsCeloBottomSheet"
      />
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
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.Thick24,
    marginTop: '50%',
  },
  description: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginBottom: Spacing.Thick24,
  },
  palmImage: {
    position: 'absolute',
    top: -60,
    left: -80,
    transform: [
      {
        rotate: '150deg',
      },
    ],
  },
  waveImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
})

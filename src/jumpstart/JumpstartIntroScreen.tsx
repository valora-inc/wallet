import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import AddAssetsBottomSheet from 'src/components/AddAssetsBottomSheet'
import BackButton from 'src/components/BackButton'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CustomHeader, { CUSTOM_HEADER_HEIGHT } from 'src/components/header/CustomHeader'
import PalmSharp from 'src/images/PalmSharp'
import WaveCurve from 'src/images/WaveCurve'
import { useAddAssetsActions } from 'src/jumpstart/useAddAssetsActions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'

export default function JumpstartIntroScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const addAssetsBottomSheetRef = React.useRef<BottomSheetRefType>(null)

  const addAssetsActions = useAddAssetsActions()
  const tokens = useSelector(jumpstartSendTokensSelector)
  const noTokens = !tokens.length

  function handleShowAddFunds() {
    AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_show_actions)
    addAssetsBottomSheetRef.current?.snapToIndex(0)
  }

  function navigateToEnterAmount() {
    navigate(Screens.JumpstartEnterAmount)
  }

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
          onPress={noTokens ? handleShowAddFunds : navigateToEnterAmount}
          text={t(noTokens ? 'jumpstartIntro.addFundsCelo.cta' : 'jumpstartIntro.haveFundsButton')}
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

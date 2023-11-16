import React, { useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import GreenLoadingSpinnerToCheck from 'src/icons/GreenLoadingSpinnerToCheck'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { swapStateSelector } from 'src/swap/selectors'
import { SwapState } from 'src/swap/slice'

export function SwapExecuteScreen() {
  const swapState = useSelector(swapStateSelector)
  const { t } = useTranslation()

  const navigateToSupport = () => {
    navigate(Screens.SupportContact)
  }

  const navigationButtons = useMemo(() => {
    switch (swapState) {
      case SwapState.ERROR:
        return (
          <View style={styles.actionBar}>
            <Button
              text={t('SwapExecuteScreen.swapActionBar.tryAgain')}
              onPress={navigateBack}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              testID="SwapExecuteScreen/TryAgain"
              style={styles.button}
            />
            <Button
              text={t('SwapExecuteScreen.swapActionBar.done')}
              onPress={navigateHome}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              testID="SwapExecuteScreen/Done"
              style={styles.button}
            />
          </View>
        )
      case SwapState.COMPLETE:
        return (
          <View style={styles.actionBar}>
            <Button
              text={t('SwapExecuteScreen.swapActionBar.done')}
              onPress={navigateHome}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              testID="SwapExecuteScreen/Done"
              style={styles.button}
            />
            <Button
              text={t('SwapExecuteScreen.swapActionBar.swapAgain')}
              onPress={navigateBack}
              type={BtnTypes.SECONDARY}
              size={BtnSizes.FULL}
              testID="SwapExecuteScreen/SwapAgain"
              style={styles.button}
            />
          </View>
        )
      default:
        return null
    }
  }, [swapState])

  const swapDisplay = useMemo(() => {
    switch (swapState) {
      default:
      case SwapState.START:
        return (
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('SwapExecuteScreen.exchangeRateSubtext')}</Text>
          </>
        )
      case SwapState.APPROVE:
        return (
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('SwapExecuteScreen.approvingSubtext')}</Text>
          </>
        )
      case SwapState.EXECUTE:
        return (
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('SwapExecuteScreen.completingSubtext')}</Text>
          </>
        )
      case SwapState.ERROR:
        return (
          <View>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapErrorSection.title')}</Text>
            <Text style={styles.subText}>{t('SwapExecuteScreen.swapErrorSection.subtitle')}</Text>
            <Touchable testID="ContactSupportTouchable" onPress={navigateToSupport}>
              <Text style={styles.contactSupportText}>
                <Trans i18nKey="SwapExecuteScreen.swapErrorSection.contactSupport">
                  <Text style={styles.contactSupportLink} />
                </Trans>
              </Text>
            </Touchable>
          </View>
        )
      case SwapState.PRICE_CHANGE:
        return (
          <Dialog
            isVisible={true}
            title={t('SwapExecuteScreen.swapPriceModal.title')}
            actionText={t('SwapExecuteScreen.swapPriceModal.action')}
            actionPress={navigateBack}
            testID="PriceChangeModal"
            onBackgroundPress={navigateBack}
          >
            {t('SwapExecuteScreen.swapPriceModal.body')}
          </Dialog>
        )
      // These states are the first and last of the swap flow
      // Avoids a flicker when resetting state.swap.swapInfo
      case SwapState.COMPLETE:
        return (
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapCompleteSection.title')}</Text>
            <Text style={styles.subText}>
              {t('SwapExecuteScreen.swapCompleteSection.subtitle')}
            </Text>
          </>
        )
    }
  }, [swapState])

  const swapIcon = useMemo(() => {
    switch (swapState) {
      default:
      case SwapState.START:
      case SwapState.APPROVE:
      case SwapState.EXECUTE:
        return <GreenLoadingSpinner />
      case SwapState.ERROR:
      case SwapState.PRICE_CHANGE:
        return <RedLoadingSpinnerToInfo />
      case SwapState.COMPLETE:
        return <GreenLoadingSpinnerToCheck />
    }
  }, [swapState])

  // Prevent back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>{swapIcon}</View>
        {swapDisplay}
      </ScrollView>
      {navigationButtons}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Regular16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1,
  },
  text: {
    ...fontStyles.h2,
    marginBottom: 16,
    textAlign: 'center',
  },
  subText: {
    ...fontStyles.regular,
    paddingHorizontal: Spacing.Regular16,
    textAlign: 'center',
    paddingBottom: Spacing.Thick24,
  },
  contactSupportText: {
    ...fontStyles.small,
    textAlign: 'center',
    color: colors.gray3,
  },
  button: {
    width: '100%',
    paddingBottom: Spacing.Regular16,
  },
  actionBar: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
  },
  contactSupportLink: {
    color: colors.onboardingBlue,
    textDecorationLine: 'underline',
  },
  iconContainer: {
    marginTop: '32%',
    marginBottom: Spacing.Regular16,
  },
})

SwapExecuteScreen.navOptions = {
  ...noHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
}

export default SwapExecuteScreen

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
import { navigate, navigateHome } from 'src/navigator/NavigationService'
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

  const navigateToSwapStart = () => {
    navigate(Screens.SwapScreen)
  }

  const navigateToReviewScreen = () => {
    navigate(Screens.SwapReviewScreen)
  }

  const navigateToSupport = () => {
    navigate(Screens.SupportContact)
  }

  const DoneAndSwapAgain = () => {
    return (
      <View style={styles.actionBar}>
        <Button
          text={t('SwapExecuteScreen.swapActionBar.done')}
          onPress={navigateHome}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          testID="SwapExecuteScreen/Done"
          style={[styles.button, { paddingBottom: Spacing.Regular16 }]}
        />
        <Button
          text={t('SwapExecuteScreen.swapAgain')}
          onPress={navigateToSwapStart}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          testID="SwapExecuteScreen/SwapAgain"
          style={styles.button}
        />
      </View>
    )
  }

  const TryAgainAndDone = () => {
    return (
      <View style={styles.actionBar}>
        <Button
          text={t('SwapExecuteScreen.swapActionBar.tryAgain')}
          onPress={navigateToReviewScreen}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          testID="SwapExecuteScreen/TryAgain"
          style={[styles.button, { paddingBottom: Spacing.Regular16 }]}
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
  }

  const SwapDisplay = useMemo(() => {
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
            <Touchable onPress={navigateToSupport}>
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
            actionPress={navigateToReviewScreen}
            testID="PriceChangeModal"
            onBackgroundPress={navigateToReviewScreen}
          >
            {t('SwapExecuteScreen.swapPriceModal.body')}
          </Dialog>
        )
      // These states are the first and last of the swap flow
      // Avoids a flicker when resetting state.swap.swapInfo
      case SwapState.COMPLETE:
        return (
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapCompleteScreen.title')}</Text>
            <Text style={styles.subText}>{t('SwapExecuteScreen.swapCompleteScreen.subtitle')}</Text>
          </>
        )
    }
  }, [swapState])

  const SwapIcon = useMemo(() => {
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

  const NavigationButtons = useMemo(() => {
    switch (swapState) {
      case SwapState.ERROR:
        return <TryAgainAndDone />
      case SwapState.COMPLETE:
        return <DoneAndSwapAgain />
      default:
        return <View style={styles.actionBar} />
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
        {SwapIcon}
        {SwapDisplay}
      </ScrollView>
      {NavigationButtons}
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
    justifyContent: 'center',
    height: '100%',
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
  },
  actionBar: {
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    minHeight: 126,
  },
  contactSupportLink: {
    color: colors.onboardingBlue,
    textDecorationLine: 'underline',
  },
})

SwapExecuteScreen.navOptions = {
  ...noHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
}

export default SwapExecuteScreen

import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import Button, { BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import Checkmark from 'src/icons/Checkmark'
import Times from 'src/icons/Times'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { swapStateSelector } from 'src/swap/selectors'
import { swapReset, SwapState } from 'src/swap/slice'

export function SwapPending() {
  const swapState = useSelector(swapStateSelector)
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const navigateToSwapStart = () => {
    dispatch(swapReset())
    navigate(Screens.SwapScreen)
  }

  const navigateToReviewScreen = () => {
    navigate(Screens.SwapReviewScreen)
  }

  const navigateToSupport = () => {
    dispatch(swapReset())
    navigate(Screens.SwapScreen)
    navigate(Screens.SupportContact)
  }

  const SwapDisplay = useMemo(() => {
    switch (swapState) {
      default:
      case SwapState.START:
        return (
          <>
            <Text style={styles.text}>{t('swapCompleteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('swapCompleteScreen.exchangeRateSubtext')}</Text>
          </>
        )
      case SwapState.APPROVE:
        return (
          <>
            <Text style={styles.text}>{t('swapCompleteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('swapCompleteScreen.approvingSubtext')}</Text>
          </>
        )
      case SwapState.EXECUTE:
        return (
          <>
            <Text style={styles.text}>{t('swapCompleteScreen.swapPending')}</Text>
            <Text style={styles.subText}>{t('swapCompleteScreen.completingSubtext')}</Text>
          </>
        )
      case SwapState.ERROR:
        return (
          <Dialog
            isVisible={true}
            title={t('swapCompleteScreen.swapErrorModal.title')}
            actionText={t('swapCompleteScreen.swapErrorModal.swapRestart')}
            actionPress={navigateToSwapStart}
            secondaryActionText={t('swapCompleteScreen.swapErrorModal.contactSupport')}
            secondaryActionPress={navigateToSupport}
            testID="ErrorModal"
          >
            {t('swapCompleteScreen.swapErrorModal.body')}
          </Dialog>
        )
      case SwapState.PRICE_CHANGE:
        return (
          <Dialog
            isVisible={true}
            title={t('swapCompleteScreen.swapPriceModal.title')}
            actionText={t('swapCompleteScreen.swapPriceModal.action')}
            actionPress={navigateToReviewScreen}
            testID="PriceChangeModal"
            onBackgroundPress={navigateToReviewScreen}
          >
            {t('swapCompleteScreen.swapPriceModal.body')}
          </Dialog>
        )
      // These states are the first and last of the swap flow
      // Avoids a flicker when resetting state.swap.swapInfo
      case SwapState.USER_INPUT:
      case SwapState.COMPLETE:
        return (
          <>
            <Text style={styles.text}>{t('swapCompleteScreen.swapSuccess')}</Text>
            <Button
              type={BtnTypes.SECONDARY}
              text={t('swapCompleteScreen.swapAgain')}
              onPress={navigateToSwapStart}
            />
          </>
        )
    }
  }, [swapState])

  const SwapIcon = useMemo(() => {
    switch (swapState) {
      default:
      case SwapState.USER_INPUT:
      case SwapState.START:
      case SwapState.APPROVE:
      case SwapState.EXECUTE:
        return (
          <ActivityIndicator
            size="large"
            color={colors.greenBrand}
            testID="SwapPending/loadingIcon"
            style={styles.activityIndicator}
          />
        )
      case SwapState.ERROR:
      case SwapState.PRICE_CHANGE:
        return (
          <View
            testID="SwapPending/errorIcon"
            style={[styles.iconContainer, { backgroundColor: colors.warning }]}
          >
            <Times color={colors.light} />
          </View>
        )
      case SwapState.COMPLETE:
        return (
          <View
            testID="SwapPending/completeIcon"
            style={[styles.iconContainer, { backgroundColor: colors.greenUI }]}
          >
            <Checkmark color={colors.light} />
          </View>
        )
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
      <View style={styles.contentContainer}>
        {SwapIcon}
        {SwapDisplay}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.Regular16,
    flexGrow: 1,
  },
  activityIndicator: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  text: {
    ...fontStyles.h2,
    marginBottom: 16,
  },
  subText: {
    ...fontStyles.regular,
  },
  iconContainer: {
    width: 44,
    height: 44,
    marginBottom: 16,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

SwapPending.navOptions = {
  ...noHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
}

export default SwapPending

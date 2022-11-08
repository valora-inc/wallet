import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import Checkmark from 'src/icons/Checkmark'
import Times from 'src/icons/Times'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateHome, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
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
    replace(Screens.SupportContact)
  }

  const NavigateHomeIcon = () => {
    return (
      <View style={styles.navigateHomeIcon}>
        <TopBarIconButton icon={<Times />} testID="ReturnHome" onPress={navigateHome} />
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
          <>
            <Text style={styles.text}>{t('SwapExecuteScreen.swapError')}</Text>
            <Dialog
              isVisible={true}
              title={t('SwapExecuteScreen.swapErrorModal.title')}
              actionText={t('SwapExecuteScreen.swapErrorModal.swapRestart')}
              actionPress={navigateToSwapStart}
              secondaryActionText={t('SwapExecuteScreen.swapErrorModal.contactSupport')}
              secondaryActionPress={navigateToSupport}
              testID="ErrorModal"
            >
              {t('SwapExecuteScreen.swapErrorModal.body')}
            </Dialog>
          </>
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
            <Text style={styles.text}>{t('SwapExecuteScreen.swapSuccess')}</Text>
            <Button
              type={BtnTypes.SECONDARY}
              text={t('SwapExecuteScreen.swapAgain')}
              onPress={navigateToSwapStart}
            />
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
        return (
          <ActivityIndicator
            size="large"
            color={colors.greenBrand}
            testID="SwapExecuteScreen/loadingIcon"
            style={styles.activityIndicator}
          />
        )
      case SwapState.ERROR:
      case SwapState.PRICE_CHANGE:
        return (
          <View
            testID="SwapExecuteScreen/errorIcon"
            style={[styles.iconContainer, { backgroundColor: colors.warning }]}
          >
            <Times color={colors.light} />
          </View>
        )
      case SwapState.COMPLETE:
        return (
          <View
            testID="SwapExecuteScreen/completeIcon"
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
      <CustomHeader left={swapState === SwapState.COMPLETE ? <NavigateHomeIcon /> : null} />
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
  navigateHomeIcon: {
    paddingHorizontal: Spacing.Thick24,
  },
})

SwapExecuteScreen.navOptions = {
  ...noHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
}

export default SwapExecuteScreen

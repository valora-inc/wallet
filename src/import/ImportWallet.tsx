import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { cancelCreateOrRestoreAccount } from 'src/account/actions'
import { accountToRecoverSelector, recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import {
  countMnemonicWords,
  formatBackupPhraseOnEdit,
  getStoredMnemonic,
  isValidBackupPhrase,
} from 'src/backup/utils'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import RecoveryPhraseInput, { RecoveryPhraseInputStatus } from 'src/components/RecoveryPhraseInput'
import { importBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isAppConnected } from 'src/redux/selectors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { normalizeMnemonic } from 'src/utils/account'
import { Currency } from 'src/utils/currencies'
import useBackHandler from 'src/utils/useBackHandler'
import { ONBOARDING_FEATURES_ENABLED } from 'src/config'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'

type Props = NativeStackScreenProps<StackParamList, Screens.ImportWallet>

/**
 * Component shown to users when they are onboarding to the application through the import / recover
 * wallet flow. Allows the user to input their mnemonic phrase to instantiate the account.
 */
function ImportWallet({ navigation, route }: Props) {
  const [backupPhrase, setBackupPhrase] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const insetsStyle = {
    paddingBottom: Math.max(0, 40 - insets.bottom),
  }

  const isImportingWallet = useSelector((state) => state.imports.isImportingWallet)
  const appConnected = useSelector(isAppConnected)
  const isRecoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)
  const accountToRecoverFromStoreWipe = useSelector(accountToRecoverSelector)
  const cloudAccountBackupEnabled =
    ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackup]

  const dispatch = useDispatch()
  const { t } = useTranslation()

  async function autocompleteSavedMnemonic() {
    if (!accountToRecoverFromStoreWipe) {
      return
    }
    const mnemonic = await getStoredMnemonic(accountToRecoverFromStoreWipe)
    if (mnemonic) {
      setBackupPhrase(mnemonic)
      onPressRestore()
    }
  }

  const handleNavigateBack = () => {
    if (cloudAccountBackupEnabled) {
      navigate(Screens.ImportSelect)
    } else {
      dispatch(cancelCreateOrRestoreAccount())
      navigateClearingStack(Screens.Welcome)
    }
    AppAnalytics.track(OnboardingEvents.restore_account_cancel)
  }

  useBackHandler(() => {
    const { routes } = navigation.getState()
    if (routes.length === 1) {
      // this screen is the only one on the stack from an app restart, let android back button handle the action
      return false
    }

    handleNavigateBack()
    return true
  }, [navigation])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TopBarTextButtonOnboarding title={t('cancel')} onPress={handleNavigateBack} />
      ),
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation])

  useEffect(() => {
    AppAnalytics.track(OnboardingEvents.wallet_import_start)
    navigation.addListener('focus', checkCleanBackupPhrase)

    if (isRecoveringFromStoreWipe) {
      autocompleteSavedMnemonic().catch((error) =>
        Logger.error(
          'ImportWallet',
          'Error while trying to recover account from store wipe:',
          error
        )
      )
    }

    return () => {
      navigation.removeListener('focus', checkCleanBackupPhrase)
    }
  }, [])

  const checkCleanBackupPhrase = () => {
    if (route.params?.clean) {
      setBackupPhrase('')
      navigation.setParams({ clean: false })
    }
  }

  const formatAndSetBackupPhrase = (input: string) => {
    // Hide the alert banner if one is displayed.
    dispatch(hideAlert())

    const updatedPhrase = formatBackupPhraseOnEdit(input)

    const currentWordCount = countMnemonicWords(backupPhrase)
    const updatedWordCount = countMnemonicWords(updatedPhrase)
    if (updatedWordCount !== currentWordCount) {
      AppAnalytics.track(OnboardingEvents.wallet_import_phrase_updated, {
        wordCount: updatedWordCount,
        wordCountChange: updatedWordCount - currentWordCount,
      })
    }

    setBackupPhrase(updatedPhrase)
  }

  const onToggleKeyboard = (visible: boolean) => {
    setKeyboardVisible(visible)
  }

  const onPressRestore = () => {
    const useEmptyWallet = !!route.params?.showZeroBalanceModal
    Keyboard.dismiss()
    dispatch(hideAlert())

    const formattedPhrase = normalizeMnemonic(backupPhrase)
    setBackupPhrase(formattedPhrase)

    navigation.setParams({ showZeroBalanceModal: false })

    AppAnalytics.track(OnboardingEvents.wallet_import_submit, {
      useEmptyWallet,
      recoveryPhraseWordCount: countMnemonicWords(formattedPhrase),
    })
    dispatch(importBackupPhrase(formattedPhrase, useEmptyWallet))
  }

  const shouldShowClipboard = (clipboardContent: string): boolean => {
    return isValidBackupPhrase(clipboardContent)
  }

  const onPressTryAnotherKey = () => {
    // Return the user to the import screen without clearing out their key.
    // It's much easier for a user to delete a phrase from the screen than reinput it if the phrase
    // is only partially wrong, or the user accidentally hits the "Go back" button.
    AppAnalytics.track(OnboardingEvents.wallet_import_cancel)
    navigation.setParams({ clean: false, showZeroBalanceModal: false })
  }

  let codeStatus = RecoveryPhraseInputStatus.Inputting
  if (isImportingWallet) {
    codeStatus = RecoveryPhraseInputStatus.Processing
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAwareScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[
          styles.scrollContainer,
          !keyboardVisible && insets && { marginBottom: insets.bottom },
        ]}
        keyboardShouldPersistTaps={'always'}
        testID="ImportWalletKeyboardAwareScrollView"
      >
        <Text style={styles.title}>{t('importExistingKey.title')}</Text>
        <RecoveryPhraseInput
          status={codeStatus}
          inputValue={backupPhrase}
          inputPlaceholder={t('importExistingKey.keyPlaceholder')}
          onInputChange={formatAndSetBackupPhrase}
          shouldShowClipboard={shouldShowClipboard}
        />
        <Text style={styles.description}>{t('importExistingKey.descriptionV1_90')}</Text>
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
      <View style={[styles.buttonContainer, !keyboardVisible && insets && insetsStyle]}>
        <Button
          testID="ImportWalletButton"
          onPress={onPressRestore}
          text={t('restore')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          disabled={isImportingWallet || !isValidBackupPhrase(backupPhrase) || !appConnected}
        />
      </View>
      <KeyboardSpacer onToggle={onToggleKeyboard} />
      <Dialog
        title={
          <Trans i18nKey="importExistingKey.emptyWalletDialog.title">
            <CurrencyDisplay
              amount={{
                value: new BigNumber(0),
                currencyCode: Currency.Dollar,
              }}
            />
          </Trans>
        }
        isVisible={!!route.params?.showZeroBalanceModal}
        actionText={t('importExistingKey.emptyWalletDialog.action')}
        actionPress={onPressRestore}
        secondaryActionPress={onPressTryAnotherKey}
        secondaryActionText={t('goBack')}
        testID="ConfirmUseAccountDialog"
      >
        {t('importExistingKey.emptyWalletDialog.description')}
      </Dialog>
    </SafeAreaView>
  )
}

ImportWallet.navigationOptions = {
  ...nuxNavigationOptions,
  // Prevent swipe back on iOS, users have to explicitly press cancel
  gestureEnabled: false,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
  },
  title: {
    textAlign: 'center',
    paddingBottom: Spacing.Thick24,
    ...typeScale.labelSemiBoldLarge,
  },
  description: {
    paddingTop: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
    ...typeScale.bodySmall,
  },
  buttonContainer: { padding: variables.contentPadding },
})

export default ImportWallet

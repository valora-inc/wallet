import { normalizeMnemonic } from '@celo/cryptographic-utils'
import { HeaderHeightContext } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { cancelCreateOrRestoreAccount } from 'src/account/actions'
import { accountToRecoverSelector, recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { isAppConnected } from 'src/redux/selectors'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import useBackHandler from 'src/utils/useBackHandler'

type Props = NativeStackScreenProps<StackParamList, Screens.ImportWallet>

/**
 * Component shown to users when they are onboarding to the application through the import / recover
 * wallet flow. Allows the user to input their mnemonic phrase to instantiate the account.
 */
function ImportWallet({ navigation, route }: Props) {
  const [backupPhrase, setBackupPhrase] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const isImportingWallet = useSelector((state) => state.imports.isImportingWallet)
  const appConnected = useSelector(isAppConnected)
  const isRecoveringFromStoreWipe = useSelector(recoveringFromStoreWipeSelector)
  const accountToRecoverFromStoreWipe = useSelector(accountToRecoverSelector)

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
    dispatch(cancelCreateOrRestoreAccount())
    ValoraAnalytics.track(OnboardingEvents.restore_account_cancel)
    getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE)
      ? navigate(Screens.ImportSelect)
      : navigateClearingStack(Screens.Welcome)
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
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          testID="Header/RestoreBackup"
          title={t('importExistingKey.header')}
        />
      ),
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation])

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.wallet_import_start)
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
      ValoraAnalytics.track(OnboardingEvents.wallet_import_phrase_updated, {
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

    ValoraAnalytics.track(OnboardingEvents.wallet_import_submit, {
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
    ValoraAnalytics.track(OnboardingEvents.wallet_import_cancel)
    navigation.setParams({ clean: false, showZeroBalanceModal: false })
  }

  let codeStatus = RecoveryPhraseInputStatus.Inputting
  if (isImportingWallet) {
    codeStatus = RecoveryPhraseInputStatus.Processing
  }

  return (
    <HeaderHeightContext.Consumer>
      {(headerHeight) => (
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <View style={styles.container}>
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
                <Text style={styles.description}>{t('importExistingKey.description')}</Text>
                <RecoveryPhraseInput
                  status={codeStatus}
                  inputValue={backupPhrase}
                  inputPlaceholder={t('importExistingKey.keyPlaceholder')}
                  onInputChange={formatAndSetBackupPhrase}
                  shouldShowClipboard={shouldShowClipboard}
                />
                <Button
                  style={styles.button}
                  testID="ImportWalletButton"
                  onPress={onPressRestore}
                  text={t('restore')}
                  size={BtnSizes.FULL}
                  type={BtnTypes.ONBOARDING}
                  disabled={
                    isImportingWallet || !isValidBackupPhrase(backupPhrase) || !appConnected
                  }
                />

                <KeyboardSpacer />
              </KeyboardAwareScrollView>
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
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      )}
    </HeaderHeightContext.Consumer>
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
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  button: {
    paddingVertical: 32,
  },
  title: {
    textAlign: 'center',
    ...fontStyles.h1,
  },
  description: {
    paddingTop: 16,
    paddingBottom: 24,
    textAlign: 'center',
    ...fontStyles.regular,
  },
})

export default ImportWallet

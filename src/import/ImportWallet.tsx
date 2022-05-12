import { HeaderHeightContext, StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Dimensions, Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { accountToRecoverSelector, recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { registrationStepsSelector } from 'src/app/selectors'
import {
  countMnemonicWords,
  formatBackupPhraseOnEdit,
  formatBackupPhraseOnSubmit,
  getStoredMnemonic,
  isValidBackupPhrase,
} from 'src/backup/utils'
import Button, { BtnTypes } from 'src/components/Button'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { importBackupPhrase } from 'src/import/actions'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import UseBackToWelcomeScreen from 'src/onboarding/UseBackToWelcomeScreen'
import { isAppConnected } from 'src/redux/selectors'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const AVERAGE_WORD_WIDTH = 80
const AVERAGE_SEED_WIDTH = AVERAGE_WORD_WIDTH * 24
// Estimated number of lines needed to enter the Recovery Phrase
const NUMBER_OF_LINES = Math.ceil(AVERAGE_SEED_WIDTH / Dimensions.get('window').width)

type Props = StackScreenProps<StackParamList, Screens.ImportWallet>

/**
 * Component shown to users when they are onboarding to the application through the import / recover
 * wallet flow. Allows the user to input their mnemonic phrase to instantiate the account.
 */
function ImportWallet({ navigation, route }: Props) {
  const [backupPhrase, setBackupPhrase] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const isImportingWallet = useTypedSelector((state) => state.imports.isImportingWallet)
  const appConnected = useSelector(isAppConnected)
  const isRecoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const accountToRecoverFromStoreWipe = useTypedSelector(accountToRecoverSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TopBarTextButtonOnboarding
          title={t('cancel')}
          // Note: redux state reset is handled by UseBackToWelcomeScreen
          onPress={() => navigate(Screens.Welcome)}
        />
      ),
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          testID="Header/RestoreBackup"
          title={t('importIt')}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
    })
  }, [navigation, step, totalSteps])

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

    const formattedPhrase = formatBackupPhraseOnSubmit(backupPhrase)
    setBackupPhrase(formattedPhrase)

    navigation.setParams({ showZeroBalanceModal: false })

    ValoraAnalytics.track(OnboardingEvents.wallet_import_submit, { useEmptyWallet })
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

  let codeStatus = CodeInputStatus.Inputting
  if (isImportingWallet) {
    codeStatus = CodeInputStatus.Processing
  }

  return (
    <HeaderHeightContext.Consumer>
      {(headerHeight) => (
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <View style={styles.container}>
              <UseBackToWelcomeScreen
                backAnalyticsEvents={[OnboardingEvents.restore_account_cancel]}
              />
              <KeyboardAwareScrollView
                style={headerHeight ? { marginTop: headerHeight } : undefined}
                contentContainerStyle={[
                  styles.scrollContainer,
                  !keyboardVisible && insets && { marginBottom: insets.bottom },
                ]}
                keyboardShouldPersistTaps={'always'}
              >
                <CodeInput
                  // TODO: Use a special component instead of CodeInput here,
                  // cause it should be used for entering verification codes only
                  label={t('accountKey')}
                  status={codeStatus}
                  inputValue={backupPhrase}
                  inputPlaceholder={t('importExistingKey.keyPlaceholder')}
                  multiline={true}
                  numberOfLines={NUMBER_OF_LINES}
                  shortVerificationCodesEnabled={false}
                  onInputChange={formatAndSetBackupPhrase}
                  shouldShowClipboard={shouldShowClipboard}
                  testID="ImportWalletBackupKeyInputField"
                />
                <Text style={styles.explanation}>{t('importExistingKey.explanation')}</Text>
                <Button
                  style={styles.button}
                  testID="ImportWalletButton"
                  onPress={onPressRestore}
                  text={t('restore')}
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
                  <Trans i18nKey="emptyAccount.title">
                    <CurrencyDisplay
                      amount={{
                        value: new BigNumber(0),
                        currencyCode: Currency.Dollar,
                      }}
                    />
                  </Trans>
                }
                isVisible={!!route.params?.showZeroBalanceModal}
                actionText={t('emptyAccount.useAccount')}
                actionPress={onPressRestore}
                secondaryActionPress={onPressTryAnotherKey}
                secondaryActionText={t('goBack')}
              >
                {t('emptyAccount.description')}
              </Dialog>
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      )}
    </HeaderHeightContext.Consumer>
  )
}

ImportWallet.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 16,
  },
  button: {
    paddingVertical: 16,
  },
  explanation: {
    ...fontStyles.regular,
    paddingHorizontal: 8,
    paddingTop: 16,
  },
})

export default ImportWallet

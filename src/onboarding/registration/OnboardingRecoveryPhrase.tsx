import Clipboard from '@react-native-clipboard/clipboard'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { recoveryPhraseInOnboardingCompleted } from 'src/account/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { useAccountKey } from 'src/backup/utils'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import CopyIcon from 'src/icons/CopyIcon'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.OnboardingRecoveryPhrase>

function OnboardingRecoveryPhrase({ navigation, route }: Props) {
  const infoBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const onboardingProps = useSelector(onboardingPropsSelector)
  // Use a lower step count for CAB onboarding
  const { step, totalSteps } = getOnboardingStepValues(
    route.params?.origin === 'cabOnboarding' ? Screens.SignInWithEmail : Screens.ProtectWallet,
    onboardingProps
  )
  const accountKey = useAccountKey()
  const dispatch = useDispatch()

  const { t } = useTranslation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        return (
          <HeaderTitleWithSubtitle
            title={t('protectWallet.title')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )
      },
      headerRight: () => (
        <TopBarTextButton
          testID="helpButton"
          title={t('help')}
          onPress={onPressHelp}
          titleStyle={{ color: colors.accent }}
        />
      ),
    })
  }, [navigation, step, totalSteps])

  const onPressHelp = () => {
    AppAnalytics.track(OnboardingEvents.protect_wallet_help)
    infoBottomSheetRef.current?.snapToIndex(0)
  }
  const onPressDismissBottomSheet = () => {
    AppAnalytics.track(OnboardingEvents.protect_wallet_help_dismiss)
    infoBottomSheetRef.current?.close()
  }
  const onPressCopy = () => {
    AppAnalytics.track(OnboardingEvents.protect_wallet_copy_phrase)
    Clipboard.setString(accountKey ?? '')
    Logger.showMessage(t('recoveryPhrase.mnemonicCopied'))
  }
  const onPressContinue = () => {
    AppAnalytics.track(OnboardingEvents.protect_wallet_complete)
    dispatch(recoveryPhraseInOnboardingCompleted())
    goToNextOnboardingScreen({ firstScreenInCurrentStep: Screens.ProtectWallet, onboardingProps })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.recoveryPhraseTitle}>{t('recoveryPhrase.titleV1_90')}</Text>
        <BackupPhraseContainer
          readOnlyStyle={styles.backupPhrase}
          value={accountKey}
          mode={BackupPhraseContainerMode.READONLY}
          type={BackupPhraseType.BACKUP_KEY}
          includeHeader={false}
        />
        <Text style={styles.recoveryPhraseBody}>{t('recoveryPhrase.bodyV1_90')}</Text>
      </ScrollView>
      <View style={styles.bottomSection}>
        <TextButton
          style={styles.copyButtonStyle}
          onPress={onPressCopy}
          testID={'protectWalletCopy'}
        >
          <View style={styles.copyIconStyle}>
            <CopyIcon color={colors.accent} />
          </View>
          {t('recoveryPhrase.copy')}
        </TextButton>
        <Button
          onPress={onPressContinue}
          text={t('recoveryPhrase.continue')}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          testID={'protectWalletBottomSheetContinue'}
        />
      </View>

      <BottomSheet
        forwardedRef={infoBottomSheetRef}
        title={t('recoveryPhrase.bottomSheet.title')}
        testId="OnboardingRecoveryPhraseBottomSheet"
      >
        <Text style={styles.bottomSheetBody}>
          {t('recoveryPhrase.bottomSheet.writeDownPhrase')}
        </Text>
        <Text style={styles.bottomSheetBody}>{t('recoveryPhrase.bottomSheet.phraseLocation')}</Text>
        <Button
          text={t('dismiss')}
          onPress={onPressDismissBottomSheet}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          style={styles.buttonStyle}
          testID="ProtectWalletBottomSheetContinue"
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

OnboardingRecoveryPhrase.navOptions = nuxNavigationOptionsOnboarding

export default OnboardingRecoveryPhrase

const styles = StyleSheet.create({
  bottomSection: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  copyIconStyle: {
    paddingRight: 10,
  },
  copyButtonStyle: {
    alignSelf: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
    color: colors.accent,
  },
  buttonStyle: {
    marginTop: Spacing.Thick24,
  },
  bottomSheetBody: {
    ...typeScale.bodyMedium,
    marginTop: 12,
    paddingBottom: 10,
  },
  backupPhrase: {
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    borderRadius: 8,
    marginTop: 0,
    backgroundColor: colors.backgroundSecondary,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 40,
  },
  container: {
    flex: 1,
  },
  recoveryPhraseBody: {
    marginTop: 28,
    ...typeScale.labelSmall,
  },
  recoveryPhraseTitle: {
    marginTop: 36,
    marginBottom: 18,
    ...typeScale.titleSmall,
  },
})

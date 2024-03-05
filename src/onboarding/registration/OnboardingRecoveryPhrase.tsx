import Clipboard from '@react-native-clipboard/clipboard'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { recoveryPhraseInOnboardingCompleted } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { useAccountKey } from 'src/backup/utils'
import BottomSheetLegacy from 'src/components/BottomSheetLegacy'
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
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.OnboardingRecoveryPhrase>

function OnboardingRecoveryPhrase({ navigation }: Props) {
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.ProtectWallet, onboardingProps)
  const accountKey = useAccountKey()
  const [showBottomSheet, setShowBottomSheet] = useState(false)
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
          titleStyle={{ color: colors.onboardingBrownLight }}
        />
      ),
    })
  }, [navigation, step, totalSteps])

  const onPressHelp = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_help)
    setShowBottomSheet(true)
  }
  const onPressDismissBottomSheet = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_help_dismiss)
    setShowBottomSheet(false)
  }
  const onPressCopy = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_copy_phrase)
    Clipboard.setString(accountKey ?? '')
    Logger.showMessage(t('recoveryPhrase.mnemonicCopied'))
  }
  const onPressContinue = () => {
    ValoraAnalytics.track(OnboardingEvents.protect_wallet_complete)
    dispatch(recoveryPhraseInOnboardingCompleted())
    goToNextOnboardingScreen({ firstScreenInCurrentStep: Screens.ProtectWallet, onboardingProps })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.recoveryPhraseTitle}>{t('recoveryPhrase.title')}</Text>
        <Text style={styles.recoveryPhraseBody}>{t('recoveryPhrase.body')}</Text>
        <BackupPhraseContainer
          readOnlyStyle={styles.backupPhrase}
          value={accountKey}
          mode={BackupPhraseContainerMode.READONLY}
          type={BackupPhraseType.BACKUP_KEY}
          includeHeader={false}
        />
        <View style={styles.bottomSection}>
          <TextButton
            style={styles.copyButtonStyle}
            onPress={onPressCopy}
            testID={'protectWalletCopy'}
          >
            <View style={styles.copyIconStyle}>
              <CopyIcon color={colors.successDark} />
            </View>
            {t('recoveryPhrase.copy')}
          </TextButton>
          <Button
            onPress={onPressContinue}
            text={t('recoveryPhrase.continue')}
            size={BtnSizes.FULL}
            type={BtnTypes.ONBOARDING}
            testID={'protectWalletBottomSheetContinue'}
          />
        </View>
      </ScrollView>

      <BottomSheetLegacy
        testID="OnboardingRecoveryPhraseBottomSheet"
        isVisible={showBottomSheet}
        onBackgroundPress={onPressDismissBottomSheet}
      >
        <View>
          <Text style={styles.bottomSheetTitle}>{t('recoveryPhrase.bottomSheet.title')}</Text>
          <Text style={styles.bottomSheetBody}>
            {t('recoveryPhrase.bottomSheet.writeDownPhrase')}
          </Text>
          <Text style={styles.bottomSheetBody}>
            {t('recoveryPhrase.bottomSheet.phraseLocation')}
          </Text>
          <TextButton
            style={styles.buttonStyle}
            onPress={onPressDismissBottomSheet}
            testID={'ProtectWalletBottomSheetContinue'}
          >
            {t('dismiss')}
          </TextButton>
        </View>
      </BottomSheetLegacy>
    </SafeAreaView>
  )
}

OnboardingRecoveryPhrase.navOptions = nuxNavigationOptionsOnboarding

export default OnboardingRecoveryPhrase

const styles = StyleSheet.create({
  bottomSection: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  copyIconStyle: {
    paddingRight: 10,
  },
  copyButtonStyle: {
    flex: 1,
    alignSelf: 'center',
    paddingBottom: 30,
    color: colors.successDark,
  },
  buttonStyle: {
    marginTop: 37,
    marginBottom: 9,
    textAlign: 'center',
    color: colors.onboardingBrownLight,
  },
  bottomSheetTitle: {
    ...fontStyles.h2,
  },
  bottomSheetBody: {
    ...fontStyles.regular,
    marginTop: 12,
    paddingBottom: 10,
  },
  backupPhrase: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    marginTop: 0,
    backgroundColor: colors.white,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  recoveryPhraseBody: {
    textAlign: 'center',
    marginTop: 16,
    ...fontStyles.regular,
    paddingBottom: 20,
  },
  recoveryPhraseTitle: {
    textAlign: 'center',
    marginTop: 36,
    ...fontStyles.h1,
  },
})

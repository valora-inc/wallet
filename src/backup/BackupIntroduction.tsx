import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { useAccountKey } from 'src/backup/utils'
import Button from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import Logo from 'src/icons/Logo'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface StateProps {
  backupCompleted: boolean
}

type NavigationProps = NativeStackScreenProps<StackParamList, Screens.BackupIntroduction>

type Props = StateProps & NavigationProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

/**
 * Component displayed to the user when entering Recovery Phrase flow from the settings menu or a
 * notification. Displays content to the user depending on whether they have set up their account
 * key backup already.
 */
class BackupIntroduction extends React.Component<Props> {
  onPressBackup = () => {
    ValoraAnalytics.track(OnboardingEvents.backup_start)
    navigate(Screens.AccountKeyEducation)
  }

  render() {
    const { backupCompleted, route } = this.props
    const showDrawerTopBar = route.params?.showDrawerTopBar

    // Conditional rendering for headers
    if (showDrawerTopBar) {
      return (
        <SafeAreaView style={styles.container}>
          <DrawerTopBar testID="BackupIntroduction/DrawerTopBar" />
          {backupCompleted ? (
            <AccountKeyPostSetup />
          ) : (
            <AccountKeyIntro onPrimaryPress={this.onPressBackup} />
          )}
        </SafeAreaView>
      )
    } else {
      return (
        <View style={styles.container}>
          {backupCompleted ? (
            <AccountKeyPostSetup />
          ) : (
            <AccountKeyIntro onPrimaryPress={this.onPressBackup} />
          )}
        </View>
      )
    }
  }
}

interface AccountKeyStartProps {
  onPrimaryPress: () => void
}

/**
 * Component displayed to the user when entering Recovery Phrase flow prior to a successful completion.
 * Introduces the user to the Recovery Phrase and invites them to set it up
 */
function AccountKeyIntro({ onPrimaryPress }: AccountKeyStartProps) {
  const { t } = useTranslation()
  return (
    <ScrollView contentContainerStyle={styles.introContainer}>
      <Logo size={32} />
      <Text style={styles.h1}>{t('introBackUpPhrase')}</Text>
      <Text style={styles.body}>{t('introCompleteQuiz')}</Text>
      <Button text={t('continue')} onPress={onPrimaryPress} testID="SetUpAccountKey" />
    </ScrollView>
  )
}

/**
 * Component displayed to the user when entering the Recovery Phrase flow after having successfully set
 * up their backup. Displays their Recovery Phrase and provides an option to learn more about the
 * Recovery Phrase, which brings them to the Recovery Phrase education flow.
 */
function AccountKeyPostSetup() {
  const accountKey = useAccountKey()

  const { t } = useTranslation()

  return (
    <ScrollView>
      <View testID="RecoveryPhraseContainer" style={styles.postSetupContainer}>
        <Text style={styles.postSetupTitle}>{t('postSetupTitle')}</Text>
        <BackupPhraseContainer
          value={accountKey}
          mode={BackupPhraseContainerMode.READONLY}
          type={BackupPhraseType.BACKUP_KEY}
          includeHeader={false}
        />
        <Text style={styles.postSetupBody}>{t('postSetupBody')}</Text>
      </View>
      <View style={styles.postSetupCTA}>
        <TextButton onPress={goToAccountKeyGuide}>{t('postSetupCTA')}</TextButton>
      </View>
    </ScrollView>
  )
}

function goToAccountKeyGuide() {
  navigate(Screens.AccountKeyEducation, { nextScreen: Screens.BackupIntroduction })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  introContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.Thick24,
    justifyContent: 'center',
  },
  postSetupContainer: {
    flexGrow: 1,
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  postSetupTitle: {
    ...fontStyles.h2,
    marginBottom: Spacing.Smallest8,
  },
  h1: {
    ...fontStyles.h1,
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Regular16,
  },
  body: {
    ...fontStyles.large,
    paddingBottom: Spacing.Regular16,
  },
  postSetupBody: {
    ...fontStyles.regular,
    marginVertical: Spacing.Regular16,
    flexGrow: 1,
  },
  postSetupCTA: {
    alignSelf: 'center',
    paddingVertical: Spacing.Regular16,
    marginBottom: Spacing.Regular16,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(BackupIntroduction)

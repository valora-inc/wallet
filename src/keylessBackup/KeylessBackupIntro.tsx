import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import Card from 'src/components/Card'
import TextButton from 'src/components/TextButton'
import CustomHeader from 'src/components/header/CustomHeader'
import EnvelopeIcon from 'src/keylessBackup/EnvelopeIcon'
import SmartphoneIcon from 'src/keylessBackup/SmartphoneIcon'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
function onPressRecoveryPhrase() {
  ValoraAnalytics.track(KeylessBackupEvents.cab_setup_recovery_phrase)
  navigate(Screens.BackupIntroduction)
}

type Props = NativeStackScreenProps<StackParamList, Screens.KeylessBackupIntro>

function KeylessBackupIntro({ route }: Props) {
  const { keylessBackupFlow } = route.params
  const isSetup = keylessBackupFlow === KeylessBackupFlow.Setup
  const { t } = useTranslation()

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader left={isSetup ? <BackButton /> : <CancelButton />} style={styles.header} />
      <ScrollView style={styles.scrollContainer}>
        {isSetup && <Text style={styles.title}>{t('keylessBackupIntro.setup.title')}</Text>}
        <Text
          style={[
            isSetup ? { ...typeScale.bodyMedium } : { ...typeScale.labelMedium },
            styles.description,
          ]}
        >
          {isSetup
            ? t('keylessBackupIntro.setup.description')
            : t('keylessBackupIntro.restore.description')}
        </Text>
        <Card style={styles.authFactorsCard} shadow={null}>
          <View style={styles.authFactorsContainer}>
            <View style={styles.authFactorLine}>
              <EnvelopeIcon style={styles.envelopeIcon} />
              <Text style={styles.authFactorText}>{t('keylessBackupIntro.emailAddress')}</Text>
            </View>
            <View style={styles.authFactorLine}>
              <SmartphoneIcon style={styles.smartphoneIcon} />
              <Text style={styles.authFactorText}>{t('keylessBackupIntro.phoneNumber')}</Text>
            </View>
          </View>

          <Text style={styles.reminderText}>
            <Trans
              i18nKey={
                isSetup
                  ? 'keylessBackupIntro.setup.reminder'
                  : 'keylessBackupIntro.restore.reminder'
              }
            >
              <Text style={styles.reminderPrefix} />
            </Trans>
          </Text>
        </Card>
        {isSetup && (
          <TextButton
            testID="keylessBackupIntro/RecoveryPhrase"
            style={styles.recoveryPhrase}
            onPress={onPressRecoveryPhrase}
          >
            {t('keylessBackupIntro.setup.useRecoveryPhrase')}
          </TextButton>
        )}
      </ScrollView>
      <Button
        testID="keylessBackupIntro/Continue"
        onPress={() => {
          if (isSetup) {
            ValoraAnalytics.track(KeylessBackupEvents.cab_setup_continue)
            navigate(Screens.SignInWithEmail, { keylessBackupFlow: KeylessBackupFlow.Setup })
          } else {
            ValoraAnalytics.track(KeylessBackupEvents.cab_restore_continue)
            navigate(Screens.SignInWithEmail, { keylessBackupFlow: KeylessBackupFlow.Restore })
          }
        }}
        text={isSetup ? t('continue') : t('next')}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

export default KeylessBackupIntro

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: Colors.black,
  },
  description: {
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
    color: Colors.black,
  },
  authFactorsCard: {
    backgroundColor: Colors.gray1,
    marginTop: Spacing.Smallest8,
    borderRadius: 10,
    padding: Spacing.Thick24,
    border: 1,
    borderColor: Colors.gray2,
  },
  authFactorsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.black}33`, // alpha 0.2 (20% opacity)
    gap: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
  },
  authFactorLine: {
    flexDirection: 'row',
    gap: 10,
  },
  smartphoneIcon: {
    alignSelf: 'center',
    marginLeft: 3,
    marginRight: 3,
  },
  envelopeIcon: {
    alignSelf: 'center',
  },
  authFactorText: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  reminderPrefix: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.black,
  },
  reminderText: {
    ...typeScale.bodyXSmall,
    textAlign: 'center',
    marginTop: Spacing.Thick24,
    color: Colors.black,
  },
  recoveryPhrase: {
    ...typeScale.labelSmall,
    textAlign: 'center',
    margin: Spacing.Thick24,
  },
  button: {
    padding: Spacing.Thick24,
  },
})

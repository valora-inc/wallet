import * as React from 'react'
import { StyleSheet, ScrollView, Text, View, TouchableOpacity } from 'react-native'
import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import { SafeAreaView } from 'react-native-safe-area-context'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import VerificationComplete from 'src/icons/VerificationComplete'
import VerificationDenied from 'src/icons/VerificationDenied'
import VerificationPending from 'src/icons/VerificationPending'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { KycStatus } from 'src/account/reducer'
import { useTranslation } from 'react-i18next'
import PersonaButton from 'src/account/Persona'
interface Props {
  kycStatus: KycStatus | undefined
}

function LinkBankAccountScreen({ kycStatus }: Props) {
  return (
    <SafeAreaView style={styles.body}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StepOne kycStatus={kycStatus} />
        <StepTwo disabled={!kycStatus || kycStatus !== KycStatus.Completed} />
      </ScrollView>
    </SafeAreaView>
  )
}

function StepOne({ kycStatus }: Props) {
  const { t } = useTranslation()

  switch (kycStatus) {
    case KycStatus.Completed:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationComplete />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.completed.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.completed.description')}</Text>
        </View>
      )
    case KycStatus.Failed:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationDenied />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.failed.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.failed.description')}</Text>
          <View style={styles.button}>
            <PersonaButton kycStatus={kycStatus} text={t('linkBankAccountScreen.tryAgain')} />
          </View>
          <TouchableOpacity
            testID="SupportContactLink"
            onPress={() => {
              navigate(Screens.SupportContact, {
                prefilledText: t('linkBankAccountScreen.failed.contactSupportPrefill'),
              })
            }}
          >
            <Text style={styles.contactSupport}>{t('contactSupport')}</Text>
          </TouchableOpacity>
        </View>
      )
    case KycStatus.Pending:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationPending />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.pending.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.pending.description')}</Text>
        </View>
      )
    default:
      /* For the Created and Expired state also show the default Begin Verification view */
      return (
        <View style={styles.stepOne}>
          <Text style={styles.label}>{t('linkBankAccountScreen.begin.label')}</Text>
          <Text style={styles.action}>{t('linkBankAccountScreen.begin.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.begin.description')}</Text>
          <View style={styles.button}>
            <PersonaButton kycStatus={kycStatus} text={t('linkBankAccountScreen.begin.cta')} />
          </View>
        </View>
      )
  }
}

function StepTwo({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  return (
    <View style={styles.stepTwo}>
      <Text style={{ ...styles.label, ...(disabled && styles.greyedOut) }}>
        {t('linkBankAccountScreen.stepTwo.label')}
      </Text>
      <Text style={{ ...styles.action, ...(disabled && styles.greyedOut) }}>
        {t('linkBankAccountScreen.stepTwo.title')}
      </Text>
      <Text style={{ ...styles.description, ...(disabled && styles.greyedOut) }}>
        {t('linkBankAccountScreen.stepTwo.description')}
      </Text>
      <Button
        text={t('linkBankAccountScreen.stepTwo.cta')}
        onPress={() => {
          /* TODO: Start Plaid Flow during M2 */
        }}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
        style={styles.button}
        disabled={disabled}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginHorizontal: 24,
  },
  contentContainer: {
    alignItems: 'center',
  },
  stepOne: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray2,
    alignItems: 'center',
    paddingVertical: 48,
  },
  stepTwo: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  label: {
    ...fontStyles.notificationHeadline,
    textAlign: 'center',
  },
  action: {
    ...fontStyles.h2,
    textAlign: 'center',
    marginTop: 12,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 48,
  },
  greyedOut: {
    color: colors.gray4,
  },
  iconContainer: {
    marginBottom: 12,
  },
  contactSupport: {
    ...fontStyles.regular600,
    marginTop: 26,
  },
  statusButton: {
    marginTop: 24,
  },
})

export default LinkBankAccountScreen

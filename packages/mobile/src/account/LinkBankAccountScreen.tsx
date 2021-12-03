import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PersonaButton from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import VerificationComplete from 'src/icons/VerificationComplete'
import VerificationDenied from 'src/icons/VerificationDenied'
import VerificationPending from 'src/icons/VerificationPending'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { kycStatusSelector } from 'src/account/selectors'
interface StepOneProps {
  kycStatus: KycStatus | undefined
}

function LinkBankAccountScreen() {
  const kycStatus = useSelector(kycStatusSelector)
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

function StepOne({ kycStatus }: StepOneProps) {
  const { t } = useTranslation()
  const [isKycVerifying, setIsKycVerifying] = useState(false)

  const onPressPersona = () => {
    // Add a bit of a delay so that Persona can popup before switching to the loading view
    setTimeout(() => setIsKycVerifying(true), 500)
  }

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
            <PersonaButton
              kycStatus={kycStatus}
              text={t('linkBankAccountScreen.tryAgain')}
              onPress={onPressPersona}
              onCancelled={() => setIsKycVerifying(false)}
            />
          </View>
          <View style={styles.contactSupportButton}>
            <BorderlessButton
              testID="SupportContactLink"
              onPress={() => {
                navigate(Screens.SupportContact, {
                  prefilledText: t('linkBankAccountScreen.failed.contactSupportPrefill'),
                })
              }}
            >
              <Text style={styles.contactSupport}>{t('contactSupport')}</Text>
            </BorderlessButton>
          </View>
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
      /* Show a spinner while Persona is in progress and we are waiting for IHL to update kycStatus */
      if (isKycVerifying) {
        return (
          <View style={styles.stepOne}>
            <View style={styles.loadingSpinnerContainer}>
              <LoadingSpinner width={30} />
            </View>
            <Text style={styles.action}>{t('linkBankAccountScreen.verifying.title')}</Text>
          </View>
        )
      }
      return (
        <View style={styles.stepOne}>
          <Text style={styles.label}>{t('linkBankAccountScreen.begin.label')}</Text>
          <Text style={styles.action}>{t('linkBankAccountScreen.begin.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.begin.description')}</Text>
          <View style={styles.button}>
            <PersonaButton
              kycStatus={kycStatus}
              text={t('linkBankAccountScreen.begin.cta')}
              onPress={onPressPersona}
              onCancelled={() => setIsKycVerifying(false)}
            />
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
  },
  contactSupportButton: {
    marginTop: 26,
  },
  loadingSpinnerContainer: {
    marginTop: 15,
    marginBottom: 27,
  },
})

export default LinkBankAccountScreen

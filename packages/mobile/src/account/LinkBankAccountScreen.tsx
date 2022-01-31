import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import PersonaButton from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { kycStatusSelector, plaidParamsSelector } from 'src/account/selectors'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import VerificationComplete from 'src/icons/VerificationComplete'
import VerificationDenied from 'src/icons/VerificationDenied'
import VerificationPending from 'src/icons/VerificationPending'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import openPlaid from './openPlaid'

interface StepOneProps {
  kycStatus: KycStatus | undefined
}

function LinkBankAccountScreen() {
  // Log a cancel event on a "back" action (hardware back button, swipe, or normal navigate back)
  const navigation = useNavigation()
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      ValoraAnalytics.track(CICOEvents.link_bank_account_cancel)
    })
    // Unsubscribe will be called on unmount
    return unsubscribe
  }, [])

  const kycStatus = useSelector(kycStatusSelector)

  return (
    <SafeAreaView style={styles.body}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StepOne kycStatus={kycStatus} />
        <StepTwo disabled={!kycStatus || kycStatus !== KycStatus.Approved} />
      </ScrollView>
    </SafeAreaView>
  )
}

export function StepOne({ kycStatus }: StepOneProps) {
  const { t } = useTranslation()
  const [isKycVerifying, setIsKycVerifying] = useState(false)

  const onPressPersona = () => {
    ValoraAnalytics.track(CICOEvents.persona_kyc_start)
    // Add a bit of a delay so that Persona can popup before switching to the loading view
    setTimeout(() => setIsKycVerifying(true), 500)
  }

  switch (kycStatus) {
    // Inquiry status https://docs.withpersona.com/docs/models-lifecycle
    case KycStatus.Approved:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationComplete />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.completed.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.completed.description')}</Text>
        </View>
      )
    case KycStatus.Declined:
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
    case KycStatus.NeedsReview:
    case KycStatus.Completed:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationPending />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.pending.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.pending.description')}</Text>
        </View>
      )
    case KycStatus.Pending:
      /* User usually enters pending state when they drop off their verification in the middle, we ask them to start from beginning */
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
              onSuccess={() => setIsKycVerifying(false)}
              onCancelled={() => setIsKycVerifying(false)}
            />
          </View>
        </View>
      )
  }
}

export function StepTwo({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const plaidParams = useSelector(plaidParamsSelector)
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
        style={styles.button}
        onPress={() =>
          openPlaid({
            ...plaidParams,
            onSuccess: ({ publicToken }) => {
              navigate(Screens.SyncBankAccountScreen, {
                publicToken,
              })
            },
            onExit: () => {
              // TODO(wallet#1447): handle errors from onExit
            },
          })
        }
        text={t('linkBankAccountScreen.stepTwo.cta')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
        testID="PlaidLinkButton"
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

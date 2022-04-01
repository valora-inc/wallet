import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { InquiryAttributes } from 'react-native-persona'
import { useDeepLinkRedirector, usePlaidEmitter } from 'react-native-plaid-link-sdk'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { setFinclusiveRegionSupported } from 'src/account/actions'
import PersonaButton from 'src/account/Persona'
import { FinclusiveKycStatus, KycStatus } from 'src/account/reducer'
import {
  finclusiveKycStatusSelector,
  finclusiveRegionSupportedSelector,
  kycStatusSelector,
  plaidParamsSelector,
} from 'src/account/selectors'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import VerificationComplete from 'src/icons/VerificationComplete'
import VerificationDenied from 'src/icons/VerificationDenied'
import VerificationPending from 'src/icons/VerificationPending'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { isUserRegionSupportedByFinclusive } from 'src/utils/supportedRegions'
import {
  finclusiveUnsupportedStatesSelector,
  linkBankAccountStepTwoEnabledSelector,
} from '../app/selectors'
import { fetchFinclusiveKyc } from './actions'
import openPlaid, { handleOnEvent } from './openPlaid'

const TAG = 'LinkBankAccountScreen'

function LinkBankAccountScreen() {
  const navigation = useNavigation()

  // Log a cancel event on a "back" action (hardware back button, swipe, or normal navigate back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      ValoraAnalytics.track(CICOEvents.link_bank_account_cancel)
    })
    // Unsubscribe will be called on unmount
    return unsubscribe
  }, [])

  return (
    <SafeAreaView style={styles.body}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <StepOne />
        <StepTwo />
      </ScrollView>
    </SafeAreaView>
  )
}

interface StepOneUIStateParams {
  kycStatus: KycStatus | undefined
  finclusiveKycStatus: FinclusiveKycStatus
  errorFromPersona: boolean
  successFromPersona: boolean
  isInPersonaFlow: boolean
}

enum StepOneUIState {
  Begin = 'Begin',
  Failure = 'Failure',
  Pending = 'Pending',
  Completed = 'Completed',
  Spinner = 'Spinner',
}
export function stepOneUIState({
  kycStatus,
  finclusiveKycStatus,
  errorFromPersona,
  successFromPersona,
  isInPersonaFlow,
}: StepOneUIStateParams): StepOneUIState {
  // The persona onSuccess / onError hooks fire slightly after the user is bounced back
  // to the LinkedBankAccount Screen. We show a spinner at this time to avoid a more
  // unpleasent screen flash as the kyc states change
  if (isInPersonaFlow) {
    return StepOneUIState.Spinner
  }

  if (finclusiveKycStatus === FinclusiveKycStatus.Accepted) {
    return StepOneUIState.Completed
  }

  const userCompletedPersona: KycStatus[] = [KycStatus.Completed, KycStatus.NeedsReview]
  const finclusiveNotCompleted = [
    FinclusiveKycStatus.Submitted,
    FinclusiveKycStatus.InReview,
    FinclusiveKycStatus.NotSubmitted,
  ]
  if (
    successFromPersona ||
    (kycStatus && userCompletedPersona.includes(kycStatus)) ||
    (kycStatus === KycStatus.Approved && finclusiveNotCompleted.includes(finclusiveKycStatus))
  ) {
    return StepOneUIState.Pending
  }

  const personaFailed: KycStatus[] = [KycStatus.Failed, KycStatus.Declined]
  if (
    errorFromPersona ||
    (kycStatus && personaFailed.includes(kycStatus)) ||
    finclusiveKycStatus === FinclusiveKycStatus.Rejected
  ) {
    return StepOneUIState.Failure
  }

  return StepOneUIState.Begin
}

export function StepOne() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [isInPersonaFlow, setIsInPersonaFlow] = useState(false)
  const [errorFromPersona, setErrorFromPersona] = useState(false)
  const [successFromPersona, setSuccessFromPersona] = useState(false)
  const kycStatus = useSelector(kycStatusSelector)
  const finclusiveKycStatus = useSelector(finclusiveKycStatusSelector)
  const stepTwoEnabled = useSelector(linkBankAccountStepTwoEnabledSelector)
  const unsupportedRegions = useSelector(finclusiveUnsupportedStatesSelector)
  const finclusiveRegionSupported = useSelector(finclusiveRegionSupportedSelector)

  const pollFinclusiveKyc = () => {
    if (kycStatus === KycStatus.Approved && finclusiveKycStatus !== FinclusiveKycStatus.Accepted) {
      dispatch(fetchFinclusiveKyc())
    }
  }
  useEffect(() => {
    pollFinclusiveKyc()
    const timer = setInterval(pollFinclusiveKyc, 5000)
    return () => clearInterval(timer)
  }, [])

  const uiState = stepOneUIState({
    kycStatus,
    finclusiveKycStatus,
    errorFromPersona,
    successFromPersona,
    isInPersonaFlow,
  })
  const onPressPersona = () => {
    ValoraAnalytics.track(CICOEvents.persona_kyc_start)
    // Add a bit of a delay so that Persona can popup before switching to the spinner view
    setTimeout(() => setIsInPersonaFlow(true), 500)
  }

  const onSuccessPersona = (address: InquiryAttributes['address']) => {
    try {
      if (isUserRegionSupportedByFinclusive(address, unsupportedRegions)) {
        dispatch(setFinclusiveRegionSupported())
      } else {
        Logger.info(TAG, 'User state not supported by finclusive')
      }
    } catch (err) {
      Logger.info(TAG, err)
    }

    setSuccessFromPersona(true)
    setIsInPersonaFlow(false)
  }

  const onErrorPersona = () => {
    setErrorFromPersona(true)
    setIsInPersonaFlow(false)
  }
  const onCanceledPersona = () => {
    setIsInPersonaFlow(false)
  }

  switch (uiState) {
    case StepOneUIState.Spinner:
      return (
        <View style={styles.stepOne}>
          <View style={styles.loadingSpinnerContainer}>
            <LoadingSpinner width={30} />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.verifying.title')}</Text>
        </View>
      )
    case StepOneUIState.Completed:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationComplete />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.completed.title')}</Text>
          <Text style={styles.description}>
            {t(
              finclusiveRegionSupported
                ? stepTwoEnabled
                  ? 'linkBankAccountScreen.completed.description'
                  : 'linkBankAccountScreen.completed.descriptionStep2NotEnabled'
                : 'linkBankAccountScreen.completed.descriptionRegionNotSupported'
            )}
          </Text>
        </View>
      )
    case StepOneUIState.Failure:
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
              onSuccess={onSuccessPersona}
              onError={onErrorPersona}
              onCancelled={onCanceledPersona}
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
    case StepOneUIState.Pending:
      return (
        <View style={styles.stepOne}>
          <View style={styles.iconContainer}>
            <VerificationPending />
          </View>
          <Text style={styles.action}>{t('linkBankAccountScreen.pending.title')}</Text>
          <Text style={styles.description}>{t('linkBankAccountScreen.pending.description')}</Text>
        </View>
      )
    case StepOneUIState.Begin:
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
              onSuccess={onSuccessPersona}
              onError={onErrorPersona}
              onCancelled={onCanceledPersona}
            />
          </View>
        </View>
      )
  }
}

export function StepTwo() {
  const { t } = useTranslation()
  const finclusiveKycStatus = useSelector(finclusiveKycStatusSelector)
  const plaidParams = useSelector(plaidParamsSelector)
  const stepTwoEnabled = useSelector(linkBankAccountStepTwoEnabledSelector)
  const disabled = !stepTwoEnabled || finclusiveKycStatus !== FinclusiveKycStatus.Accepted
  // This is used to handle universal links within React Native
  // https://plaid.com/docs/link/oauth/#handling-universal-links-within-react-native
  useDeepLinkRedirector()
  usePlaidEmitter(handleOnEvent)

  return (
    <View style={styles.stepTwo}>
      <Text style={{ ...styles.label, ...(disabled && styles.greyedOut) }}>
        {t('linkBankAccountScreen.stepTwo.label')}
      </Text>
      <Text style={{ ...styles.action, ...(disabled && styles.greyedOut) }}>
        {stepTwoEnabled
          ? t('linkBankAccountScreen.stepTwo.title')
          : t('linkBankAccountScreen.stepTwo.disabledTitle')}
      </Text>
      <Text style={{ ...styles.description, ...(disabled && styles.greyedOut) }}>
        {stepTwoEnabled
          ? t('linkBankAccountScreen.stepTwo.description')
          : t('linkBankAccountScreen.stepTwo.disabledDescription')}
      </Text>
      <Button
        style={styles.button}
        onPress={async () => {
          ValoraAnalytics.track(CICOEvents.add_initial_bank_account_start)
          await openPlaid({
            ...plaidParams,
            onSuccess: ({ publicToken }) => {
              navigate(Screens.SyncBankAccountScreen, {
                publicToken,
              })
            },
            onExit: ({ error }) => {
              if (error) {
                navigate(Screens.LinkBankAccountErrorScreen, {
                  error: error,
                })
              }
            },
          })
        }}
        text={
          stepTwoEnabled
            ? t('linkBankAccountScreen.stepTwo.cta')
            : t('linkBankAccountScreen.stepTwo.disabledCta')
        }
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

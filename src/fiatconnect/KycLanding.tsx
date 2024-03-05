import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { CICOEvents, FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PRIVACY_LINK } from 'src/brandingConfig'
import BackButton from 'src/components/BackButton'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LinkAccountSection, getTranslationStrings } from 'src/fiatconnect/LinkAccountScreen'
import { personaInProgressSelector } from 'src/fiatconnect/selectors'
import { personaFinished, personaStarted, postKyc } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import CheckBox from 'src/icons/CheckBox'
import GreyOut from 'src/icons/GreyOut'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'

export interface Props {
  quote: FiatConnectQuote
  flow: CICOFlow
  step: 'one' | 'two'
  personaKycStatus?: KycStatus
}

export default function KycLanding(
  props: NativeStackScreenProps<StackParamList, Screens.KycLanding>
) {
  const { quote, flow, step, personaKycStatus } = props.route.params
  const personaInProgress = useSelector(personaInProgressSelector)

  if (personaInProgress) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator testID="personaInProgress" size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView>
      <StepOne disabled={step !== 'one'} personaKycStatus={personaKycStatus} quote={quote} />
      <StepTwo quote={quote} flow={flow} disabled={step !== 'two'} />
    </ScrollView>
  )
}

KycLanding.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.KycLanding>
}) => ({
  ...emptyHeader,
  headerLeft: () => (
    <BackButton
      eventName={FiatExchangeEvents.cico_fc_link_kyc_account_back}
      eventProperties={{
        flow: route.params.flow,
        provider: route.params.quote.getProviderId(),
        fiatAccountSchema: route.params.quote.getFiatAccountSchema(),
        step: route.params.step,
      }}
    />
  ),
  headerTitle: i18n.t(getTranslationStrings(route.params.quote.getFiatAccountType()).header),
})

const useComponentSize = (): [
  { width: number; height: number },
  (event: LayoutChangeEvent) => void,
] => {
  const { width, height } = Dimensions.get('window')
  const [size, setSize] = useState({
    height,
    width,
  })

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setSize({ width, height })
  }, [])

  return [size, onLayout]
}

function StepOne(props: {
  disabled: boolean
  personaKycStatus?: KycStatus
  quote: FiatConnectQuote
}) {
  const { t } = useTranslation()
  const { disabled, personaKycStatus, quote } = props
  const [size, onLayout] = useComponentSize()
  return (
    <View onLayout={onLayout} style={styles.stepOne}>
      {disabled && <GreyOut testID="step-one-grey" {...size} />}
      <Text style={styles.stepText}>{t('fiatConnectKycLandingScreen.stepOne')}</Text>
      <KycAgreement personaKycStatus={personaKycStatus} quote={quote} disabled={disabled} />
    </View>
  )
}

function StepTwo(props: { quote: FiatConnectQuote; flow: CICOFlow; disabled: boolean }) {
  const { quote, flow, disabled } = props
  const { t } = useTranslation()
  const [size, onLayout] = useComponentSize()
  return (
    <View onLayout={onLayout} style={styles.stepTwo}>
      {disabled && <GreyOut testID="step-two-grey" {...size} />}
      <Text style={styles.stepText}>{t('fiatConnectKycLandingScreen.stepTwo')}</Text>
      <LinkAccountSection quote={quote} flow={flow} disabled={disabled} />
    </View>
  )
}

function KycAgreement(props: {
  personaKycStatus?: KycStatus
  quote: FiatConnectQuote
  disabled: boolean
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { personaKycStatus, quote, disabled } = props
  const [agreementChecked, toggleAgreementChecked] = useState(false)

  const onPressPrivacyPolicy = () => {
    navigateToURI(PRIVACY_LINK)
  }

  return (
    <SafeAreaView style={styles.content}>
      <Text style={styles.title}>{t('fiatConnectKycLandingScreen.title')}</Text>
      <Text testID="descriptionText" style={styles.description}>
        {t('fiatConnectKycLandingScreen.description')}
      </Text>
      <View style={styles.consentContainer}>
        <TouchableOpacity
          onPress={() => toggleAgreementChecked(!agreementChecked)}
          style={styles.checkBoxContainer}
        >
          {/* If disabled, the user is in step 2 and this should be completed already*/}
          <CheckBox testID="checkbox" checked={disabled || agreementChecked} />
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          <Trans i18nKey={'fiatConnectKycLandingScreen.disclaimer'}>
            <Text
              testID="providerNameText"
              style={styles.privacyLink}
              onPress={onPressPrivacyPolicy}
            />
          </Trans>
        </Text>
      </View>
      <Persona
        text={t('fiatConnectKycLandingScreen.button') ?? undefined}
        kycStatus={personaKycStatus}
        disabled={disabled || !agreementChecked}
        onPress={() => {
          setTimeout(() => {
            dispatch(personaStarted())
          }, 500) // delay to avoid screen flash
          ValoraAnalytics.track(CICOEvents.persona_kyc_start)
        }}
        onSuccess={() => {
          dispatch(postKyc({ quote }))
        }}
        onCanceled={() => {
          dispatch(personaFinished())
        }}
        onError={() => {
          dispatch(personaFinished())
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  stepOne: {
    alignItems: 'center',
    paddingVertical: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray2,
  },
  stepTwo: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  stepText: {
    ...fontStyles.notificationHeadline,
    textAlign: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
    marginHorizontal: 16,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  disclaimer: {
    color: Colors.gray5,
    textAlign: 'left',
    marginLeft: 11,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  privacyLink: {
    textDecorationLine: 'underline',
  },
  consentContainer: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 27,
    marginBottom: 12,
  },
  checkBoxContainer: {
    marginTop: 3,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
})

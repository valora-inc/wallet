import { TouchableOpacity } from '@gorhom/bottom-sheet'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PRIVACY_LINK } from 'src/brandingConfig'
import FiatConnectLinkAccountScreen, { LinkAccountSection } from 'src/fiatconnect/LinkAccountScreen'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import CheckBox from 'src/icons/CheckBox'
import GreyOut from 'src/icons/GreyOut'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

export interface Props {
  quote: FiatConnectQuote
  flow: CICOFlow
  step: 'one' | 'two'
  personaKycStatus: KycStatus | undefined
}

export default function KycLanding(props: StackScreenProps<StackParamList, Screens.KycLanding>) {
  const { quote, flow, step, personaKycStatus: kycStatus } = props.route.params
  return (
    <ScrollView>
      <StepOne disabled={step !== 'one'} kycStatus={kycStatus} />
      <StepTwo quote={quote} flow={flow} disabled={step !== 'two'} />
    </ScrollView>
  )
}

KycLanding.navigationOptions = FiatConnectLinkAccountScreen.navigationOptions

function StepOne(props: { disabled: boolean; kycStatus: KycStatus | undefined }) {
  const { t } = useTranslation()
  const { disabled, kycStatus } = props
  const [dimensions, setDimensions] = useState({
    height: 0,
    width: 0,
  })
  return (
    <View
      onLayout={(event) => {
        setDimensions(event.nativeEvent.layout)
      }}
      style={styles.stepOne}
    >
      {disabled && <GreyOut {...dimensions} />}
      <Text style={styles.stepText}>{t('fiatConnectKycLandingScreen.stepOne')}</Text>
      <KycAgreement kycStatus={kycStatus} />
    </View>
  )
}

function StepTwo(props: { quote: FiatConnectQuote; flow: CICOFlow; disabled: boolean }) {
  const { quote, flow, disabled } = props
  const { t } = useTranslation()
  const [dimensions, setDimensions] = useState({
    height: 0,
    width: 0,
  })
  return (
    <View
      onLayout={(event) => {
        setDimensions(event.nativeEvent.layout)
      }}
      style={styles.stepTwo}
    >
      {disabled && <GreyOut {...dimensions} />}
      <Text style={styles.stepText}>{t('fiatConnectKycLandingScreen.stepTwo')}</Text>
      <LinkAccountSection quote={quote} flow={flow} disabled={disabled} />
    </View>
  )
}

export function KycAgreement(props: { kycStatus: KycStatus | undefined }) {
  const { t } = useTranslation()
  const { kycStatus } = props
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
          <CheckBox checked={agreementChecked} />
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
        text={t('fiatConnectKycLandingScreen.button')}
        kycStatus={kycStatus}
        disabled={!agreementChecked}
        onPress={() => ValoraAnalytics.track(CICOEvents.persona_kyc_start)}
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
})

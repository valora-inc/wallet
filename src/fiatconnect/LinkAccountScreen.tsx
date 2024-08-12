import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { typeScale } from 'src/styles/fonts'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectLinkAccount>

interface LinkAccountScreenTranslationKeys {
  bodyTitle: string
  description: string
  header: string
}

/**
 * Small helper function to map the account type to its name used in the base translation
 * file.
 */
export function getTranslationStrings(
  accountType: FiatAccountType
): LinkAccountScreenTranslationKeys {
  return {
    [FiatAccountType.BankAccount]: {
      bodyTitle: 'fiatConnectLinkAccountScreen.bankAccount.bodyTitle',
      description: 'fiatConnectLinkAccountScreen.bankAccount.description',
      header: 'fiatConnectLinkAccountScreen.bankAccount.header',
    },
    [FiatAccountType.DuniaWallet]: {
      bodyTitle: 'fiatConnectLinkAccountScreen.duniaWallet.bodyTitle',
      description: 'fiatConnectLinkAccountScreen.duniaWallet.description',
      header: 'fiatConnectLinkAccountScreen.duniaWallet.header',
    },
    [FiatAccountType.MobileMoney]: {
      bodyTitle: 'fiatConnectLinkAccountScreen.mobileMoney.bodyTitle',
      description: 'fiatConnectLinkAccountScreen.mobileMoney.description',
      header: 'fiatConnectLinkAccountScreen.mobileMoney.header',
    },
  }[accountType]
}

export default function FiatConnectLinkAccountScreen({ route }: Props) {
  const { quote, flow } = route.params
  return <LinkAccountSection quote={quote} flow={flow} />
}

export function LinkAccountSection(props: {
  quote: FiatConnectQuote
  flow: CICOFlow
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { quote, flow, disabled } = props
  const { bodyTitle, description } = getTranslationStrings(quote.getFiatAccountType())

  const onPressContinue = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_link_account_continue, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
    })
    navigate(Screens.FiatDetailsScreen, { quote, flow })
  }

  const onPressProvider = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_link_account_provider_website, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
      page: 'home',
    })
    navigate(Screens.WebViewScreen, { uri: quote.getProviderWebsiteUrl() })
  }

  const onPressTermsAndConditions = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_link_account_provider_website, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
      page: 'termsAndConditions',
    })
    navigate(Screens.WebViewScreen, { uri: quote.getProviderTermsAndConditionsUrl() })
  }

  const onPressPrivacyPolicy = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_link_account_provider_website, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
      page: 'privacyPolicy',
    })
    navigate(Screens.WebViewScreen, { uri: quote.getProviderPrivacyPolicyUrl() })
  }

  return (
    <SafeAreaView style={styles.content}>
      <Text style={styles.title}>{t(bodyTitle)}</Text>
      <Text testID="descriptionText" style={styles.description}>
        <Trans i18nKey={description} values={{ providerName: quote.getProviderName() }}>
          <Text testID="providerNameText" style={styles.providerLink} onPress={onPressProvider} />
          <Text
            testID="termsAndConditionsText"
            style={styles.providerLink}
            onPress={onPressTermsAndConditions}
          />
          <Text
            testID="privacyPolicyText"
            style={styles.providerLink}
            onPress={onPressPrivacyPolicy}
          />
        </Trans>
      </Text>
      <Button
        style={styles.button}
        testID="continueButton"
        onPress={onPressContinue}
        text={t('fiatConnectLinkAccountScreen.continue')}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
        disabled={disabled}
      />
    </SafeAreaView>
  )
}

FiatConnectLinkAccountScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectLinkAccount>
}) => ({
  ...emptyHeader,
  headerLeft: () => (
    <BackButton
      eventName={FiatExchangeEvents.cico_fc_link_account_back}
      eventProperties={{
        flow: route.params.flow,
        provider: route.params.quote.getProviderId(),
        fiatAccountSchema: route.params.quote.getFiatAccountSchema(),
      }}
    />
  ),
  headerTitle: i18n.t(getTranslationStrings(route.params.quote.getFiatAccountType()).header),
})

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typeScale.titleSmall,
    marginHorizontal: 16,
  },
  description: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  button: {
    marginTop: 12,
  },
  providerLink: {
    textDecorationLine: 'underline',
  },
})

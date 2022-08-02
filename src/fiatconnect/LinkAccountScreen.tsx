import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectLinkAccount>

export default function FiatConnectLinkAccountScreen({ route }: Props) {
  const { t } = useTranslation()
  const { quote, flow } = route.params

  const onPressContinue = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_link_account_continue, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
    })
    navigate(Screens.FiatDetailsScreen, { quote, flow })
  }

  const onPressProvider = () => {
    navigate(Screens.WebViewScreen, { uri: quote.getProviderWebsiteUrl() })
  }

  return (
    <SafeAreaView style={styles.content}>
      <Text style={styles.title}>{t('fiatConnectLinkAccountScreen.bankAccount.bodyTitle')}</Text>
      <Text testID="descriptionText" style={styles.description}>
        <Trans
          i18nKey={'fiatConnectLinkAccountScreen.bankAccount.description'}
          values={{ providerName: quote.getProviderName() }}
        >
          <Text testID="providerNameText" style={styles.providerLink} onPress={onPressProvider} />
        </Trans>
      </Text>
      <Button
        style={styles.button}
        testID="continueButton"
        onPress={onPressContinue}
        text={t('fiatConnectLinkAccountScreen.continue')}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
      />
    </SafeAreaView>
  )
}

FiatConnectLinkAccountScreen.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  // NOTE: title should be dynamic when we support multiple fiat account types
  headerTitle: i18n.t('fiatConnectLinkAccountScreen.bankAccount.header'),
})

const styles = StyleSheet.create({
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
  button: {
    marginTop: 12,
  },
  providerLink: {
    textDecorationLine: 'underline',
  },
})

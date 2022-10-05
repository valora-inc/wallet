import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import TextButton from 'src/components/TextButton'
import i18n from 'src/i18n'
import CancelButton from 'src/components/CancelButton'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { Screens } from 'src/navigator/Screens'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import colors from 'src/styles/colors'

const getNavigationOptions = ({
  fiatConnectKycStatus,
  quote,
}: {
  fiatConnectKycStatus: FiatConnectKycStatus
  quote: FiatConnectQuote
}) => {
  const onPressSupport = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_contact_support, {
      provider: quote.getProviderId(),
      flow: quote.flow,
      fiatConnectKycStatus,
    })
    navigate(Screens.SupportContact, {
      prefilledText: i18n.t('fiatConnectKycStatusScreen.contactSupportPrefill'),
    })
  }

  const onPressBack = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_back, {
      provider: quote.getProviderId(),
      flow: quote.flow,
      fiatConnectKycStatus,
    })
    navigate(Screens.SelectProvider, {
      flow: quote.flow,
      selectedCrypto: quote.getCryptoType(),
      amount: {
        crypto: Number(quote.getCryptoAmount()),
        fiat: Number(quote.getFiatAmount()),
      },
    })
  }
  return {
    ...emptyHeader,
    headerLeft: () => (
      <View style={styles.cancelBtnContainer}>
        <CancelButton buttonType="icon" style={styles.cancelBtnContainer} onCancel={onPressBack} />
      </View>
    ),
    headerRight: () => (
      <TextButton testID="contactSupport" style={styles.supportBtn} onPress={onPressSupport}>
        {i18n.t('fiatConnectKycStatusScreen.contactSupport')}
      </TextButton>
    ),
  }
}
const styles = StyleSheet.create({
  cancelBtnContainer: {
    padding: Spacing.Thick24,
  },
  supportBtn: {
    ...fontStyles.regular,
    color: colors.gray3,
    paddingHorizontal: Spacing.Thick24,
  },
})

export default getNavigationOptions

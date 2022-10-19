import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CancelButton from 'src/components/CancelButton'
import TextButton from 'src/components/TextButton'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

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

  const onPressCancel = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_back, {
      provider: quote.getProviderId(),
      flow: quote.flow,
      fiatConnectKycStatus,
    })
    navigateHome()
  }
  return {
    ...emptyHeader,
    headerLeft: () => (
      <View style={styles.cancelBtnContainer}>
        <CancelButton
          buttonType="icon"
          style={styles.cancelBtnContainer}
          onCancel={onPressCancel}
        />
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

import { getAddressChunks } from '@celo/utils/lib/address'
import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { FiatExchangeEvents, HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles, { fontFamily } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import Logger from 'src/utils/Logger'

interface Props {
  address: string
  touchDisabled?: boolean
  location?: Screens
}

export default function AccountNumber({ address, touchDisabled, location }: Props) {
  const { t } = useTranslation()
  const onPressAddress = () => {
    if (!address.length) {
      return
    }
    Clipboard.setString(address)
    Logger.showMessage(t('addressCopied'))
    vibrateInformative()

    if (location === Screens.TransactionDetailsScreen) {
      ValoraAnalytics.track(HomeEvents.transaction_feed_address_copy)
    }

    if (location === Screens.ExternalExchanges) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_cash_out_copy_address)
    }

    if (location === Screens.ProfileMenu) {
      ValoraAnalytics.track(HomeEvents.profile_address_copy)
    }
  }
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = getAddressChunks(address)
  const addressString = '0x ' + addressChunks.join(' ')

  return touchDisabled ? (
    <Text testID="AccountNumber" style={styles.text}>
      {addressString}
    </Text>
  ) : (
    <TouchableOpacity
      onLongPress={onPressAddress}
      onPress={onPressAddress}
      testID="CopyAddressToClipboard"
    >
      <Text testID="AccountNumber" style={styles.text}>
        {addressString}
      </Text>
      <Text style={styles.link}>{t('tapToCopy')}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  line: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
    marginBottom: 8,
  },
  link: {
    ...fontStyles.label,
    textDecorationLine: 'underline',
    color: colors.gray4,
    fontFamily,
  },
})

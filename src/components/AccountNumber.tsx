import { getAddressChunks } from '@celo/utils/lib/address'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FiatExchangeEvents, HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import Copy from 'src/icons/Copy'
import { Screens } from 'src/navigator/Screens'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

interface Props {
  key?: string
  address: string
  short?: boolean
  touchDisabled?: boolean
  location?: Screens
}

export default function AccountNumber({
  key = 'AccountAddress',
  short = false,
  address,
  touchDisabled,
  location,
}: Props) {
  const { t } = useTranslation()
  const onPressAddress = () => {
    if (!address.length) {
      return
    }
    Clipboard.setString(address)
    Logger.showMessage(t('addressCopied'))

    if (location === Screens.DrawerNavigator) {
      ValoraAnalytics.track(HomeEvents.drawer_address_copy)
    }

    if (location === Screens.TransactionReview) {
      ValoraAnalytics.track(HomeEvents.transaction_feed_address_copy)
    }

    if (location === Screens.ExternalExchanges) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_cash_out_copy_address)
    }
  }
  // Turns '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
  // into 'ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10 ce10'
  const addressChunks = getAddressChunks(address)
  const addressString = short ? formatShortenedAddress(address) : '0x ' + addressChunks.join(' ')

  return touchDisabled ? (
    <Text key={key} style={styles.text}>
      {addressString}
    </Text>
  ) : (
    <View style={styles.container}>
      <TouchableOpacity
        key={key}
        style={short ? styles.clickable : null}
        onLongPress={onPressAddress}
        onPress={onPressAddress}
        testID="CopyAddressToClipboard"
      >
        <Text style={[styles.text, short ? styles.shortText : null]}>{addressString}</Text>
        {short && <Copy />}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: variables.contentPadding,
  },
  clickable: {
    backgroundColor: Colors.gray2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.gray3,
  },
  text: {
    ...fontStyles.small,
    color: colors.gray5,
  },
  shortText: {
    marginRight: 3,
  },
})

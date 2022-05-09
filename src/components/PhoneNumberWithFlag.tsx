import { getCountryEmoji, parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  e164PhoneNumber: string
  defaultCountryCode?: string
}

export class PhoneNumberWithFlag extends React.PureComponent<Props> {
  render() {
    const parsedNumber = parsePhoneNumber(this.props.e164PhoneNumber, this.props.defaultCountryCode)
    return (
      <View style={styles.container}>
        <Text style={[fontStyles.small, styles.countryCodeContainer]}>
          {parsedNumber
            ? getCountryEmoji(
                this.props.e164PhoneNumber,
                parsedNumber.countryCode,
                parsedNumber.regionCode
              )
            : getCountryEmoji(this.props.e164PhoneNumber)}
        </Text>
        <Text style={[fontStyles.small, styles.phoneNumber]}>
          {parsedNumber ? parsedNumber.displayNumberInternational : ''}
        </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  countryCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  phoneNumber: {
    color: colors.gray4,
  },
})

export default PhoneNumberWithFlag

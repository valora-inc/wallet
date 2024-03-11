import { getCountryEmoji, parsePhoneNumber } from '@celo/phone-utils'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'

interface Props {
  e164PhoneNumber: string
  defaultCountryCode?: string
  textColor?: Colors
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
        <Text
          style={{
            ...typeScale.labelSmall,
            lineHeight: 18,
            color: this.props.textColor ?? Colors.black,
          }}
        >
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
})

export default PhoneNumberWithFlag

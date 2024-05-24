import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import { withTranslation } from 'src/i18n'
import { Recipient, getDisplayName } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import fontStyles from 'src/styles/fonts'

const DEFAULT_ICON_SIZE = 40

interface OwnProps {
  recipient: Recipient
  e164Number?: string
  iconSize?: number
  displayNameStyle?: TextStyle
}

type Props = OwnProps & WithTranslation

export function Avatar(props: Props) {
  const defaultCountryCode = useSelector(defaultCountryCodeSelector) ?? undefined
  const { recipient, e164Number, iconSize = DEFAULT_ICON_SIZE, displayNameStyle, t } = props

  const name = getDisplayName(recipient, t)
  const address = recipient.address
  const e164NumberToShow = recipient.e164PhoneNumber || e164Number

  return (
    <View style={styles.container}>
      <ContactCircle recipient={recipient} size={iconSize} />
      <Text
        style={[displayNameStyle || fontStyles.small500, styles.contactName]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {name}
      </Text>
      {!!e164NumberToShow && (
        <PhoneNumberWithFlag
          e164PhoneNumber={e164NumberToShow}
          defaultCountryCode={defaultCountryCode}
        />
      )}
      {!e164NumberToShow && !!address && !!recipient.name && (
        <Text style={[fontStyles.small, styles.contactName]} numberOfLines={1} ellipsizeMode="tail">
          {formatShortenedAddress(address)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactName: {
    paddingTop: 6,
    marginHorizontal: 20,
    textAlign: 'center',
  },
})

export default withTranslation<Props>()(Avatar)

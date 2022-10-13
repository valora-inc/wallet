import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import Touchable from 'src/components/Touchable'
import Logo, { LogoTypes } from 'src/icons/Logo'
import {
  getDisplayDetail,
  getDisplayName,
  Recipient,
  RecipientType,
} from 'src/recipients/recipient'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

interface Props {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
}

function getRecipientType(recipient: Recipient) {
  if (recipient.e164PhoneNumber && !recipient.address) {
    return RecipientType.PhoneNumber
  } else if (recipient.address) {
    return RecipientType.Address
  }
  return undefined
}

function RecipientItem({ recipient, onSelectRecipient }: Props) {
  const { t } = useTranslation()

  const onPress = () => {
    onSelectRecipient({
      ...recipient,
      recipientType: recipient.recipientType ?? getRecipientType(recipient),
    })
  }

  // if (recipient.recipientType == RecipientType.Address)
  return (
    <Touchable onPress={onPress} testID="RecipientItem">
      <View style={styles.row}>
        <ContactCircle style={styles.avatar} recipient={recipient} />
        <View style={styles.contentContainer}>
          <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.name}>
            {getDisplayName(recipient, t)}
          </Text>
          {recipient.name && <Text style={styles.phone}>{getDisplayDetail(recipient)}</Text>}
        </View>
        <View style={styles.rightIconContainer}>
          {recipient.address ? <Logo style={styles.logo} type={LogoTypes.GREEN} /> : null}
        </View>
      </View>
    </Touchable>
  )

  // return <></>
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: variables.contentPadding,
    flexWrap: 'wrap',
  },
  avatar: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...fontStyles.regular500, color: colors.dark },
  phone: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginRight: 16,
  },
})

export default memo(RecipientItem)

import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import Touchable from 'src/components/Touchable'
import PhoneIcon from 'src/icons/Phone'
import WalletIcon from 'src/icons/navigator/Wallet'
import {
  addressToVerificationStatusSelector,
  e164NumberToAddressSelector,
} from 'src/identity/selectors'
import Logo from 'src/images/Logo'
import {
  Recipient,
  RecipientType,
  getDisplayDetail,
  getDisplayName,
  recipientHasNumber,
} from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
  loading: boolean
  selected?: boolean
}

const ICON_SIZE = 10

function RecipientItem({ recipient, onSelectRecipient, loading, selected }: Props) {
  const { t } = useTranslation()

  const onPress = () => {
    Keyboard.dismiss()
    onSelectRecipient(recipient)
  }

  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const addressToVerificationStatus = useSelector(addressToVerificationStatusSelector)

  // TODO(ACT-980): avoid icon flash when a known contact is clicked
  const showAppIcon = useMemo(() => {
    if (recipient.recipientType === RecipientType.PhoneNumber) {
      return recipient.e164PhoneNumber && !!e164NumberToAddress[recipient.e164PhoneNumber]
    }
    return recipient.address && addressToVerificationStatus[recipient.address]
  }, [e164NumberToAddress, recipient])

  return (
    <Touchable onPress={onPress} testID="RecipientItem">
      <View style={[styles.row, selected && styles.rowSelected]}>
        <View>
          <ContactCircle
            style={styles.avatar}
            recipient={recipient}
            backgroundColor={Colors.gray1}
            foregroundColor={Colors.black}
            borderColor={Colors.gray2}
            DefaultIcon={() => renderDefaultIcon(recipient)} // no need to honor color props here since the color we need match the defaults
          />
          {!!showAppIcon && (
            <Logo
              color={Colors.white}
              style={styles.appIcon}
              size={ICON_SIZE}
              testID="RecipientItem/AppIcon"
            />
          )}
        </View>
        <View style={styles.contentContainer}>
          <Text numberOfLines={1} ellipsizeMode={'tail'} style={styles.name}>
            {getDisplayName(recipient, t)}
          </Text>
          {!!recipient.name && <Text style={styles.phone}>{getDisplayDetail(recipient)}</Text>}
        </View>
        {loading && (
          <View style={styles.rightIconContainer}>
            <ActivityIndicator
              size="small"
              color={Colors.accent}
              testID="RecipientItem/ActivityIndicator"
            />
          </View>
        )}
      </View>
    </Touchable>
  )
}

function renderDefaultIcon(recipient: Recipient) {
  if (recipientHasNumber(recipient)) {
    return <PhoneIcon color={Colors.black} size={24} testID="RecipientItem/PhoneIcon" />
  } else {
    return <WalletIcon color={Colors.black} size={24} testID="RecipientItem/WalletIcon" />
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    alignItems: 'center',
  },
  rowSelected: {
    backgroundColor: Colors.gray1,
  },
  avatar: {
    marginRight: Spacing.Small12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...typeScale.labelMedium, color: Colors.black },
  phone: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    position: 'absolute',
    top: 22,
    left: 22,
    backgroundColor: Colors.accent,
    padding: 4,
    borderRadius: 100,
    // To override the default shadow props on the logo
    shadowColor: undefined,
    shadowOpacity: undefined,
    shadowRadius: undefined,
    shadowOffset: undefined,
  },
})

export default memo(RecipientItem)

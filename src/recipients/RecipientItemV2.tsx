import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import Touchable from 'src/components/Touchable'
import Logo from 'src/icons/Logo'
import QuestionIcon from 'src/icons/QuestionIcon'
import {
  addressToVerificationStatusSelector,
  e164NumberToAddressSelector,
} from 'src/identity/selectors'
import {
  Recipient,
  RecipientType,
  getDisplayDetail,
  getDisplayName,
} from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import colors, { Colors } from 'src/styles/colors'
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

  // TODO(ACT-980): avoid icon flash when a known valora contact is clicked
  const showValoraIcon = useMemo(() => {
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
            DefaultIcon={() => <QuestionIcon />} // no need to honor color props here since the color we need match the defaults
          />
          {!!showValoraIcon && (
            <Logo
              color={colors.white}
              style={styles.valoraIcon}
              size={ICON_SIZE}
              testID="RecipientItem/ValoraIcon"
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
              color={colors.primary}
              testID="RecipientItem/ActivityIndicator"
            />
          </View>
        )}
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
    alignItems: 'center',
  },
  rowSelected: {
    backgroundColor: colors.gray1,
  },
  avatar: {
    marginRight: Spacing.Small12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...typeScale.labelMedium, color: colors.black },
  phone: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  valoraIcon: {
    position: 'absolute',
    top: 22,
    left: 22,
    backgroundColor: '#42D689',
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

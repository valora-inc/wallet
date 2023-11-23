import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import ContactCircle from 'src/components/ContactCircle'
import Touchable from 'src/components/Touchable'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { Recipient, getDisplayDetail, getDisplayName } from 'src/recipients/recipient'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  recipient: Recipient
  onSelectRecipient(recipient: Recipient): void
  loading: boolean
}

/**
 * @deprecated new recipient screen should use RecipientItemV2
 */
function RecipientItem({ recipient, onSelectRecipient, loading }: Props) {
  const { t } = useTranslation()

  const onPress = () => {
    onSelectRecipient(recipient)
  }

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
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : recipient.address ? (
            <Logo type={LogoTypes.GREEN} />
          ) : null}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.Small12,
    paddingHorizontal: variables.contentPadding,
    alignItems: 'center',
  },
  avatar: {
    marginRight: Spacing.Small12,
  },
  contentContainer: {
    flex: 1,
  },
  name: { ...fontStyles.regular500, color: colors.black },
  phone: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default memo(RecipientItem)

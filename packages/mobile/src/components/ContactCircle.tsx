import * as React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import DefaultAvatar from 'src/icons/DefaultAvatar'
import { Recipient } from 'src/recipients/recipient'
import fontStyles from 'src/styles/fonts'

interface Props {
  style?: ViewStyle
  size?: number
  recipient: Recipient
}

const DEFAULT_ICON_SIZE = 40

const getAddressBackgroundColor = (address: string) =>
  `hsl(${parseInt(address.substring(0, 5), 16) % 360}, 53%, 93%)`
const getAddressForegroundColor = (address: string) =>
  `hsl(${parseInt(address.substring(0, 5), 16) % 360}, 67%, 24%)`
const getNameInitial = (name: string) => name.charAt(0).toLocaleUpperCase()

function ContactCircle({ size, recipient, style }: Props) {
  const address = recipient.address
  const iconSize = size || DEFAULT_ICON_SIZE
  const iconBackgroundColor = getAddressBackgroundColor(address || '0x0')

  const renderThumbnail = () => {
    if (recipient.thumbnailPath) {
      return (
        <Image
          source={{ uri: recipient.thumbnailPath }}
          style={[
            styles.image,
            { height: iconSize, width: iconSize, borderRadius: iconSize / 2.0 },
          ]}
          resizeMode={'cover'}
        />
      )
    }

    const fontColor = getAddressForegroundColor(address || '0x0')
    if (recipient.name) {
      const initials = getNameInitial(recipient.name)
      return (
        <Text
          allowFontScaling={false}
          style={[fontStyles.iconText, { fontSize: iconSize / 2.0, color: fontColor }]}
        >
          {initials.toLocaleUpperCase()}
        </Text>
      )
    }

    return <DefaultAvatar foregroundColor={fontColor} backgroundColor={iconBackgroundColor} />
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: iconBackgroundColor,
            height: iconSize,
            width: iconSize,
            borderRadius: iconSize / 2,
          },
        ]}
      >
        {renderThumbnail()}
      </View>
    </View>
  )
}

export default ContactCircle

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    margin: 'auto',
    alignSelf: 'center',
  },
})

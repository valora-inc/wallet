import * as React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import User from 'src/icons/User'
import { Recipient } from 'src/recipients/recipient'
import Colors, { ColorValue } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  style?: ViewStyle
  size?: number
  recipient: Recipient
  backgroundColor?: ColorValue
  foregroundColor?: ColorValue
  borderColor?: ColorValue
  DefaultIcon?: React.ComponentType<{
    color?: ColorValue
    backgroundColor?: ColorValue
    size?: number
  }>
}

const DEFAULT_ICON_SIZE = 40

function ContactCircle({
  size: iconSize = DEFAULT_ICON_SIZE,
  recipient,
  style,
  backgroundColor = Colors.backgroundSecondary,
  foregroundColor = Colors.contentPrimary,
  borderColor,
  DefaultIcon = User,
}: Props) {
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

    if (recipient.name) {
      const initial = recipient.name.charAt(0).toLocaleUpperCase()
      return (
        <Text
          allowFontScaling={false}
          style={[
            typeScale.labelMedium,
            { fontSize: iconSize / 2.0, color: foregroundColor, lineHeight: iconSize / 1.5 },
          ]}
        >
          {initial.toLocaleUpperCase()}
        </Text>
      )
    }

    return (
      <DefaultIcon
        size={Math.round(iconSize / 1.625)}
        color={foregroundColor}
        backgroundColor={backgroundColor}
      />
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor,
            height: iconSize,
            width: iconSize,
            borderRadius: iconSize / 2,
          },
          borderColor && {
            borderColor,
            borderWidth: 1,
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

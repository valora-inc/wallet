import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CopyIcon from 'src/icons/CopyIcon'
import Logger from 'src/utils/Logger'

interface Props {
  shortLink: string
  touchDisabled?: boolean
}

export default function ShortAccountLink({ shortLink, touchDisabled }: Props) {
  const onPressLink = () => {
    if (!shortLink.length) {
      return
    }
    Clipboard.setString(shortLink)
    Logger.showMessage('Short link copied')
  }
  // Remove 'https://' from displayed link
  const shorterLink = shortLink.slice(8)
  const formattedLink = (
    <View style={[styles.line]}>
      <Text style={[styles.text]}>{shorterLink}</Text>
      <CopyIcon />
    </View>
  )

  return touchDisabled ? (
    <View style={styles.container}>{formattedLink}</View>
  ) : (
    <TouchableOpacity style={styles.container} onLongPress={onPressLink} onPress={onPressLink}>
      {formattedLink}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: colors.gray2,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  line: {
    width: 200,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.large,
    color: colors.dark,
  },
})

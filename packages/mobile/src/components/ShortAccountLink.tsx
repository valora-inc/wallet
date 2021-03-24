import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import Clipboard from '@react-native-community/clipboard'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
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

  const formattedLink = (
    <>
      (
      <View style={[styles.line]}>
        <Text style={[styles.text]}>{shortLink}</Text>
      </View>
      )
    </>
  )

  return formattedLink
  /* touchDisabled ? (
    <View style={styles.container}>{formattedLink}</View>
  ) : (
    <TouchableOpacity style={styles.container} onLongPress={onPressLink} onPress={onPressLink}>
      {formattedLink}
    </TouchableOpacity>
  ) */
}

const styles = StyleSheet.create({
  container: {
    width: 200,
  },
  line: {
    width: 150,
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  text: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

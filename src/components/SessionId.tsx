import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import Logger from 'src/utils/Logger'

interface Props {
  sessionId: string
}

export default function SessionId({ sessionId }: Props) {
  const onPressSessionId = () => {
    if (!sessionId.length) {
      return
    }
    Clipboard.setString(sessionId)
    Logger.showMessage('session ID copied')
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPressSessionId}>
      <Text style={styles.text}>{sessionId}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 215,
  },
  text: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
})

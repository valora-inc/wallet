import React from 'react'
import { StyleSheet, Text } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface BottomTextProps {
  children: React.ReactNode
}

export default function BottomText({ children }: BottomTextProps) {
  return <Text style={styles.text}>{children}</Text>
}

const styles = StyleSheet.create({
  text: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
    marginTop: 'auto',
  },
})

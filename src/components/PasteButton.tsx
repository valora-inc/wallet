import React from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useClipboard } from 'src/utils/useClipboard'

interface Props {
  onPress?: (clipboardContent: string, event: GestureResponderEvent) => void
}

export const PasteButton = ({ onPress }: Props) => {
  const { t } = useTranslation()
  const [, , getFreshClipboardContent] = useClipboard()

  const handlePasteClipboard = async (event: GestureResponderEvent) => {
    const content = await getFreshClipboardContent()
    onPress?.(content, event)
  }

  return (
    <Touchable onPress={handlePasteClipboard}>
      <Text style={styles.text}>{t('paste')}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    ...typeScale.semiBoldMedium,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.greenUI,
  },
})

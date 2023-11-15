import React from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useClipboard } from 'src/utils/useClipboard'

interface Props {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  onPress?: (event: GestureResponderEvent) => void
}

export const PasteButton = ({ value, setValue, onPress }: Props) => {
  const { t } = useTranslation()
  const [, , getFreshClipboardContent] = useClipboard()

  const pasteClipboard = async (event: GestureResponderEvent) => {
    const content = await getFreshClipboardContent()
    setValue(content)
    onPress?.(event)
  }

  // when a value is already set, remove the button
  if (value) return null

  return (
    <Touchable onPress={pasteClipboard}>
      <Text style={styles.text}>{t('paste')}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    ...typeScale.semiBoldMedium,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.greenUI,
  },
})

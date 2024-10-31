import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useClipboard } from 'src/utils/useClipboard'

interface Props {
  onPress: (clipboardContent: string) => void
}

export const PasteButton = ({ onPress }: Props) => {
  const { t } = useTranslation()
  const [, , getFreshClipboardContent] = useClipboard()

  const handlePasteClipboard = async () => {
    const content = await getFreshClipboardContent()
    onPress(content)
  }

  return (
    <Touchable onPress={handlePasteClipboard}>
      <Text style={styles.text}>{t('paste')}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  text: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.accent,
  },
})

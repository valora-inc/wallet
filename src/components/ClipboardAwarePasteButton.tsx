import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, Platform, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  getClipboardContent: () => Promise<string>
  shouldShow: boolean
  onPress: (clipboardContent: string) => void
}

export default React.memo(function ClipboardAwarePasteButton({
  getClipboardContent,
  shouldShow,
  onPress,
}: Props) {
  const { t } = useTranslation()

  useLayoutEffect(() => {
    if (Platform.OS !== 'android') {
      LayoutAnimation.easeInEaseOut()
    }
  }, [shouldShow])

  async function onPressInternal() {
    onPress(await getClipboardContent())
  }

  if (!shouldShow) {
    return null
  }

  return (
    <View style={styles.container}>
      <Touchable onPress={onPressInternal} style={styles.button} testID={'PasteButton'}>
        <Text maxFontSizeMultiplier={1} style={styles.fontStyle}>
          {t('paste')}
        </Text>
      </Touchable>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.Thick24,
    backgroundColor: colors.white,
    flexDirection: 'row',
    height: Spacing.XLarge48,
    flexGrow: 1,
  },
  fontStyle: {
    ...typeScale.labelSemiBoldMedium,
    color: colors.black,
  },
})

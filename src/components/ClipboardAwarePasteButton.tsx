import { debounce } from 'lodash'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, Platform, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

const BUTTON_TAP_DEBOUNCE_TIME = 300 // milliseconds
const DEBOUNCE_OPTIONS = {
  leading: true,
  trailing: false,
}

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

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = debounce(
    async () => {
      await onPressInternal()
    },
    BUTTON_TAP_DEBOUNCE_TIME,
    DEBOUNCE_OPTIONS
  )

  return (
    <View style={styles.container}>
      {/* these Views cannot be combined as it will cause ripple to not respect the border radius */}
      <View style={styles.containRipple}>
        <Touchable onPress={debouncedOnPress} style={styles.button} testID={'PasteButton'}>
          <>
            <Text maxFontSizeMultiplier={1} style={styles.fontStyle}>
              {t('paste')}
            </Text>
          </>
        </Touchable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  // on android Touchable Provides a ripple effect, by itself it does not respect the border radius on Touchable
  containRipple: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'column',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
    flexDirection: 'row',
    height: 48,
    flexGrow: 1,
  },
  fontStyle: {
    ...typeScale.labelSemiBoldMedium,
    color: colors.black,
    marginLeft: 0,
    marginRight: 0,
  },
})

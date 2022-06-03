import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import BottomSheet from 'src/components/BottomSheet'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'

interface Props {
  targetUrl: string
  isVisible: boolean
  onClose(): void
  toggleBottomSheet(): void
}

export function WebViewAndroidBottomSheet({
  targetUrl,
  isVisible,
  onClose,
  toggleBottomSheet,
}: Props) {
  const { t } = useTranslation()
  const openExternalLink = (uri: string) => {
    navigateToURI(uri)
    toggleBottomSheet()
  }

  return (
    <BottomSheet
      style={{ borderTopRightRadius: 0, borderTopLeftRadius: 0 }}
      isVisible={isVisible}
      onBackgroundPress={onClose}
    >
      <View>
        <View style={styles.centerContainer}>
          <Pressable
            style={styles.pressable}
            onPress={() => openExternalLink(targetUrl)}
            android_ripple={{ color: Colors.gray2, borderless: false }}
          >
            <Text style={styles.bottomSheetText}>{t('webView.openExternal')}</Text>
          </Pressable>
          <Pressable onPress={onClose} android_ripple={{ color: Colors.gray2, borderless: false }}>
            <Text style={styles.bottomSheetText}>{t('dismiss')}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
  },
  // Needed to add icons in the pressable buttons
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSheetText: {
    ...fontStyles.regular,
    textAlign: 'left',
    padding: variables.contentPadding,
  },
})

export default WebViewAndroidBottomSheet

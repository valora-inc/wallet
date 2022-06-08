import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'

function Bridge() {
  const { t } = useTranslation()
  const scrollPosition = useRef(new Animated.Value(0)).current

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('bridgeScreen.title')}</Text>}
        scrollPosition={scrollPosition}
      />
      <Text>Hello Bridge</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
})

export default Bridge

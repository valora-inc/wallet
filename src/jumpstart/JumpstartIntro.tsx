import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import CustomHeader, { CUSTOM_HEADER_HEIGHT } from 'src/components/header/CustomHeader'
import Leaf from 'src/images/Leaf'
import WaveCurve from 'src/images/WaveCurve'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  children?: React.ReactNode
  button: React.ReactNode
  showNoAssetsHint?: boolean
}

export default function JumpstartIntro({ button, children, showNoAssetsHint }: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  console.log('BOTTOM', insets.bottom)

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <Leaf style={styles.palmImage} />
      <WaveCurve style={styles.waveImage} />
      <CustomHeader style={styles.header} left={<BackButton />} />

      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>{t('jumpstartIntro.title')}</Text>

        <View style={styles.description}>
          <Text style={styles.descriptionLine}>{t('jumpstartIntro.description')}</Text>
          {showNoAssetsHint && (
            <Text style={styles.descriptionLine}>{t('jumpstartIntro.noFundsHint')}</Text>
          )}
        </View>

        {button}
      </ScrollView>

      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  container: {
    paddingHorizontal: Spacing.Thick24,
    flex: 1,
    gap: Spacing.Regular16,
    justifyContent: 'center',
    marginTop: -CUSTOM_HEADER_HEIGHT,
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
    textAlign: 'center',
  },
  description: {
    gap: 4,
  },
  descriptionLine: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  palmImage: {
    position: 'absolute',
    top: 0,
    right: 20,
  },
  waveImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
})

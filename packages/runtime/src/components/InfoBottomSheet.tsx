import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheetLegacy from 'src/components/BottomSheetLegacy'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  isVisible: boolean
  onDismiss?: () => void
  title: string
  body: string
  testID?: string
}
export default function InfoBottomSheet({ isVisible, onDismiss, title, body, testID }: Props) {
  const { t } = useTranslation()
  return (
    <BottomSheetLegacy
      testID={testID}
      isVisible={isVisible}
      onBackgroundPress={onDismiss}
      backgroundColor={colors.black}
      opacity={0.25}
    >
      <View style={styles.root}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <TextButton onPress={onDismiss} style={styles.button}>
          {t('dismiss')}
        </TextButton>
      </View>
    </BottomSheetLegacy>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 24,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  title: {
    ...typeScale.titleSmall,
    textAlign: 'center',
    marginTop: 22,
  },
  body: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 37,
    marginBottom: 9,
    textAlign: 'center',
    color: colors.onboardingBrownLight,
  },
})

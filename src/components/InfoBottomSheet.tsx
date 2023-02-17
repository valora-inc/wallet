import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet from 'src/components/BottomSheet'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

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
    <BottomSheet testID={testID} isVisible={isVisible} onBackgroundPress={onDismiss}>
      <View style={styles.root}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <TextButton onPress={onDismiss} style={styles.button}>
          {t('dismiss')}
        </TextButton>
      </View>
    </BottomSheet>
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
    ...fontStyles.h2,
    textAlign: 'center',
    marginTop: 22,
  },
  body: {
    ...fontStyles.regular,
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

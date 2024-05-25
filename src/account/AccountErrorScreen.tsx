import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import TextButton from 'src/components/TextButton'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  title: string
  testID: string
  description: string
  onPress(): void
  buttonLabel: string
  onPressSecondary?(): void
  secondaryButtonLabel?: string | null
}

function AccountErrorScreen({
  title,
  testID,
  description,
  onPress,
  buttonLabel,
  secondaryButtonLabel,
  onPressSecondary,
}: Props) {
  return (
    <SafeAreaView style={styles.content}>
      <Text style={styles.title} testID={testID}>
        {title}
      </Text>
      <Text style={styles.body}>{description}</Text>
      <TextButton onPress={onPress} testID={`${testID}Button`}>
        {buttonLabel}
      </TextButton>
      {!!secondaryButtonLabel && onPressSecondary && (
        <TextButton
          style={styles.secondaryButton}
          onPress={onPressSecondary}
          testID={`${testID}ButtonSecondary`}
        >
          {secondaryButtonLabel}
        </TextButton>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    marginHorizontal: Spacing.Thick24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingBottom: Spacing.Thick24,
  },
  secondaryButton: {
    paddingTop: Spacing.Thick24,
  },
})

export default AccountErrorScreen

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, View } from 'react-native'
import TextInput from 'src/components/TextInput'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface SendSelectRecipientSearchInputProps {
  input: string
  onChangeText: (value: string) => void
}

export function SendSelectRecipientSearchInput({
  input,
  onChangeText,
}: SendSelectRecipientSearchInputProps) {
  const { t } = useTranslation()
  return (
    <View testID="SendSelectRecipientSearchInput" style={styles.textInputContainer}>
      <TextInput
        placeholder={t('sendSelectRecipient.searchText') ?? undefined}
        value={input}
        onChangeText={onChangeText}
        style={styles.search}
        inputStyle={styles.input}
        placeholderTextColor={colors.gray4}
        // Font scaling is causing issues on Android
        allowFontScaling={Platform.OS === 'ios'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    ...typeScale.bodySmall,
    color: colors.gray4,
    marginRight: 24,
    flex: 1,
    paddingHorizontal: Spacing.Regular16,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 100,
  },
  search: {
    borderColor: colors.gray2,
    borderRadius: 100,
  },
  input: {
    ...typeScale.bodySmall,
    // Unset lineHeight to avoid font scaling issues
    lineHeight: undefined,
  },
})

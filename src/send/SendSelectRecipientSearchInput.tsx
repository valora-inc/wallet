import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
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
    <View style={styles.textInputContainer}>
      <Text>{t('sendSelectRecipient.searchInputLabel')}</Text>
      <TextInput
        placeholder={t('sendSelectRecipient.searchInputPlaceholder') ?? undefined}
        value={input}
        onChangeText={onChangeText}
        style={styles.search}
        inputStyle={styles.input}
        placeholderTextColor={colors.gray4}
        // Font scaling is causing issues on Android
        allowFontScaling={Platform.OS === 'ios'}
        testID="SendSelectRecipientSearchInput"
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
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 100,
    backgroundColor: 'yellow',
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

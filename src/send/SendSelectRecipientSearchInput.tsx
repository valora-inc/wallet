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
      <Text style={styles.label} allowFontScaling={Platform.OS === 'ios'}>
        {t('sendSelectRecipient.searchInputLabel')}
      </Text>
      <TextInput
        placeholder={t('sendSelectRecipient.searchInputPlaceholder') ?? undefined}
        value={input}
        onChangeText={onChangeText}
        inputStyle={styles.input}
        placeholderTextColor={colors.gray3}
        // Font scaling is causing issues on Android
        allowFontScaling={Platform.OS === 'ios'}
        testID="SendSelectRecipientSearchInput"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.Smallest8,
    paddingVertical: Spacing.Smallest8,
    paddingHorizontal: Spacing.Small12,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 100,
  },
  input: {
    ...typeScale.bodySmall,
    // Unset lineHeight to avoid font scaling issues
    lineHeight: undefined,
    paddingVertical: 0,
    height: 24,
  },
  label: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.gray3,
  },
})

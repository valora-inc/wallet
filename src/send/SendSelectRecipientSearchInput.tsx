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
      <Text style={styles.label}>{t('sendSelectRecipient.searchInputLabel')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 100,
    backgroundColor: 'yellow',
    height: 36,
  },
  search: {
    // padding: 0,
    // backgroundColor: 'lightblue',
  },
  input: {
    ...typeScale.bodySmall,
    // Unset lineHeight to avoid font scaling issues
    lineHeight: undefined,
    backgroundColor: 'aquamarine',
    // padding: 0,
    // margin: 0,
  },
  label: {
    ...typeScale.labelSemiBoldSmall,
    lineHeight: undefined,
    color: colors.gray3,
  },
})

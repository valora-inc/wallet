import { isValidAddress } from '@celo/utils/lib/address'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import TextInput from 'src/components/TextInput'
import withTextSearchPasteAware from 'src/components/WithTextSearchPasteAware'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

const SearchInput = withTextSearchPasteAware(TextInput)

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
      <SearchInput
        shouldShowClipboard={isValidAddress}
        placeholder={t('sendSelectRecipient.searchText') ?? undefined}
        value={input}
        onChangeText={onChangeText}
        style={styles.search}
        inputStyle={styles.input}
        leftIcon={<></>}
        placeholderTextColor={colors.gray4}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    ...typeScale.bodySmall,
    color: colors.gray4,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 12,
    flex: 1,
  },
  search: {
    alignItems: 'center',
    borderColor: colors.gray2,
    borderRadius: 100,
  },
  input: {
    ...typeScale.bodySmall,
  },
})

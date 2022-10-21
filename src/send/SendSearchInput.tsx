import { isValidAddress } from '@celo/utils/lib/address'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import withTextSearchPasteAware from 'src/components/WithTextSearchPasteAware'
import colors from 'src/styles/colors'

const SearchInput = withTextSearchPasteAware(BottomSheetTextInput)

interface SendSearchInputProps {
  input: string
  onChangeText: (value: string) => void
}

// Input field for Send screen
export function SendSearchInput({ input, onChangeText }: SendSearchInputProps) {
  const { t } = useTranslation()

  return (
    <View testID="SendSearchInput" style={styles.textInputContainer}>
      <SearchInput
        shouldShowClipboard={isValidAddress}
        placeholder={t('namePhoneAddress')}
        value={input}
        onChangeText={onChangeText}
        leftIcon={<Text style={styles.leftIcon}>{t('to')}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  leftIcon: {
    color: colors.gray5,
  },
})

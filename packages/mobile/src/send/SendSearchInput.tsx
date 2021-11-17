import TextInput from '@celo/react-components/components/TextInput'
import withTextSearchPasteAware from '@celo/react-components/components/WithTextSearchPasteAware'
import colors from '@celo/react-components/styles/colors'
import { isValidAddress } from '@celo/utils/lib/address'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import i18n, { Namespaces } from 'src/i18n'

const SearchInput = withTextSearchPasteAware(TextInput)

interface SendSearchInputProps {
  input: string
  onChangeText: (value: string) => void
}

// Input field for Send screen
export function SendSearchInput({ input, onChangeText }: SendSearchInputProps) {
  const { t } = useTranslation(Namespaces.sendFlow7)

  return (
    <View style={styles.textInputContainer}>
      <SearchInput
        shouldShowClipboard={isValidAddress}
        placeholder={t('namePhoneAddress')}
        value={input}
        onChangeText={onChangeText}
        leftIcon={<Text style={styles.leftIcon}>{i18n.t('to')}</Text>}
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

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
  onChangeText: (value: string) => void
  leftIcon?: React.ReactNode
}

// Input field for Send screen
export function SendSearchInput(props: SendSearchInputProps) {
  const handleChangeText = (value: string) => {
    setInput(value)
    onChangeText(value)
  }

  const { t } = useTranslation(Namespaces.sendFlow7)
  const { onChangeText } = props
  const [input, setInput] = React.useState('')

  return (
    <View style={styles.textInputContainer}>
      <SearchInput
        shouldShowClipboard={isValidAddress}
        placeholder={t('global:namePhoneAddress')}
        value={input}
        onChangeText={handleChangeText}
        leftIcon={<Text style={styles.leftIcon}>{i18n.t('global:to')}</Text>}
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

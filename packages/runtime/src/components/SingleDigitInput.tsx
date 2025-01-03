import * as React from 'react'
import { StyleSheet } from 'react-native'
import TextInput from 'src/components/TextInput'
import colors from 'src/styles/colors'

export interface SingleDigitInputProps {
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  testID?: string
  forwardedRef: any
}

type Props = SingleDigitInputProps

// Multiline enabled as to handle unexpected cursor behavior
// https://github.com/facebook/react-native/issues/28794#issuecomment-877769852

export function SingleDigitInput({
  inputValue,
  inputPlaceholder,
  onInputChange,
  testID,
  forwardedRef,
}: Props) {
  return (
    <TextInput
      multiline={true}
      textAlign={'center'}
      value={inputValue}
      placeholder={inputPlaceholder}
      onChangeText={onInputChange}
      maxLength={1}
      showClearButton={false}
      style={styles.codeInput}
      testID={testID}
      ref={forwardedRef}
    />
  )
}

const styles = StyleSheet.create({
  codeInput: {
    borderColor: colors.gray2,
    borderRadius: 3,
    borderWidth: 1,
    flex: 0,
    backgroundColor: colors.white,
    height: 50,
    width: 50,
    marginVertical: 5,
  },
})

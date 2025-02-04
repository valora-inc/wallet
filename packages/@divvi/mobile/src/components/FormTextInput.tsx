import React from 'react'
import TextInput, { TextInputProps } from 'src/components/TextInput'
import colors from 'src/styles/colors'

type Props = TextInputProps

export default function FormTextInput({ inputStyle, ...passThroughProps }: Props) {
  return (
    <TextInput
      inputStyle={inputStyle}
      placeholderTextColor={colors.inactive}
      underlineColorAndroid="transparent"
      {...passThroughProps}
    />
  )
}

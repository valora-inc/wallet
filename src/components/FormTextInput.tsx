import React from 'react'
import { View } from 'react-native'
import FormUnderline from 'src/components/FormUnderline'
import TextInput, { TextInputProps } from 'src/components/TextInput'
import colors from 'src/styles/colors'

type Props = TextInputProps

export default function FormTextInput({ style, inputStyle, ...passThroughProps }: Props) {
  return (
    <View style={style}>
      <TextInput
        inputStyle={inputStyle}
        placeholderTextColor={colors.gray3}
        underlineColorAndroid="transparent"
        {...passThroughProps}
      />
      <FormUnderline />
    </View>
  )
}

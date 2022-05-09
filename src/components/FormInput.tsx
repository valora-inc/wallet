import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import FormField from 'src/components/FormField'
import FormTextInput, { Props as FormTextInputProps } from 'src/components/FormTextInput'

type Props = Omit<FormTextInputProps, 'style'> & {
  style?: StyleProp<ViewStyle>
  label: string
}

export default function FormInput({ style, label, ...passThroughProps }: Props) {
  return (
    <FormField label={label} style={style}>
      <FormTextInput {...passThroughProps} />
    </FormField>
  )
}

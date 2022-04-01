/**
 * TextInput with input validation, interchangeable with `./TextInput.tsx`
 */

import { validateInput, ValidatorKind } from '@celo/utils/lib/inputValidation'
import * as React from 'react'
import { KeyboardType } from 'react-native'
import TextInput, { TextInputProps } from 'src/components/TextInput'

interface OwnProps {
  InputComponent: React.ComponentType<TextInputProps>
  value: string
  onChangeText: (input: string) => void
  keyboardType: KeyboardType
  numberOfDecimals?: number
  placeholder?: string
  decimalSeparator?: string
  forwardedRef?:
    | ((instance: React.ComponentType<TextInputProps> | null) => void)
    | React.MutableRefObject<React.ComponentType<TextInputProps> | null>
    | null
}

export interface PhoneValidatorProps {
  validator: ValidatorKind.Phone
  countryCallingCode: string
}

export interface IntegerValidatorProps {
  validator: ValidatorKind.Integer
}

export interface DecimalValidatorProps {
  validator: ValidatorKind.Decimal
  numberOfDecimals: number
}

// Required props for a custom input validator
export interface CustomValidatorProps {
  validator: ValidatorKind.Custom
  customValidator: (input: string) => string
}

export type ValidatorProps =
  | PhoneValidatorProps
  | IntegerValidatorProps
  | DecimalValidatorProps
  | CustomValidatorProps

export type ValidatedTextInputProps = OwnProps & ValidatorProps & TextInputProps

export default class ValidatedTextInput extends React.Component<ValidatedTextInputProps> {
  onChangeText = (input: string): void => {
    const validated = validateInput(input, this.props)
    // Don't propagate change if new change is invalid
    if (this.props.value === validated) {
      return
    }
    if (this.props.onChangeText) {
      this.props.onChangeText(validated)
    }
  }

  getMaxLength = () => {
    const { numberOfDecimals, validator, value, decimalSeparator } = this.props
    if (validator !== ValidatorKind.Decimal || !numberOfDecimals) {
      return undefined
    }
    const decimalPos = value.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return undefined
    }
    return decimalPos + (numberOfDecimals as number) + 1
  }

  render() {
    const { InputComponent = TextInput, ...passThroughProps } = this.props

    return (
      <InputComponent
        maxLength={this.getMaxLength()}
        {...passThroughProps}
        onChangeText={this.onChangeText}
      />
    )
  }
}

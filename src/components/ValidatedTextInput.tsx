/**
 * TextInput with input validation, interchangeable with `./TextInput.tsx`
 */

import * as React from 'react'
import { KeyboardType } from 'react-native'
import TextInput, { TextInputProps } from 'src/components/TextInput'
import { validateInput, ValidatorKind } from 'src/utils/inputValidation'

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
    // some countries support multiple phone number lengths. since we add the
    // country code to a validated phone number in the UI, we need to omit the
    // country code from subsequent validations if the user types a longer number.
    // note: the countryCallingCode is a string like "+31"
    const userInput =
      this.props.validator === ValidatorKind.Phone
        ? (input.split(this.props.countryCallingCode)[1] ?? input)
        : input
    const validated = validateInput(userInput, this.props)

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

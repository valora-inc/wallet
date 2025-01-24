import { FiatAccountSchema, FiatAccountSchemas } from '@fiatconnect/fiatconnect-types'
import { KeyboardType } from 'react-native'

export interface FormFieldParam {
  name: string
  label?: string | null
  infoDialog?: {
    title: string
    actionText: string
    body: string
  }
  format?(input: string): string
  validate(
    input: string,
    fieldNamesToValues?: Record<string, string>
  ): {
    isValid: boolean
    errorMessage?: string
  }
  placeholderText: string
  keyboardType: KeyboardType
  isVisible?(fieldNamesToValues: Record<string, string>): boolean
}

export interface ImplicitParam<T, K extends keyof T> {
  name: string
  value: T[K]
}

export interface ComputedParam<T, K extends keyof T> {
  name: string
  computeValue: (otherFields: Partial<T>) => T[K]
}

export type FiatAccountFormSchema<T extends FiatAccountSchema> = {
  [Property in keyof FiatAccountSchemas[T]]:
    | FormFieldParam
    | ImplicitParam<FiatAccountSchemas[T], Property>
    | ComputedParam<FiatAccountSchemas[T], Property>
}

import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getAccountNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/accountNumber'
import {
  ComputedParam,
  FormFieldParam,
  ImplicitParam,
} from 'src/fiatconnect/fiatAccountSchemas/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'

export const getSchema = ({
  fiatAccountSchema,
  country,
  fiatAccountType,
  schemaCountryOverrides,
}: {
  fiatAccountSchema: FiatAccountSchema
  country: string | null
  fiatAccountType: FiatAccountType
  schemaCountryOverrides: FiatAccountSchemaCountryOverrides
}) => {
  if (!country) {
    throw new Error('Country not supported')
  }
  switch (fiatAccountSchema) {
    case FiatAccountSchema.AccountNumber:
      return getAccountNumberSchema(
        {
          country,
          fiatAccountType,
        },
        schemaCountryOverrides
      )
    default:
      throw new Error('Unsupported schema type')
  }
}

export function isFormFieldParam<T, K extends keyof T>(
  item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
): item is FormFieldParam {
  return 'keyboardType' in item
}
export function isImplicitParam<T, K extends keyof T>(
  item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
): item is ImplicitParam<T, K> {
  return 'value' in item
}
export function isComputedParam<T, K extends keyof T>(
  item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
): item is ComputedParam<T, K> {
  return 'computeValue' in item
}

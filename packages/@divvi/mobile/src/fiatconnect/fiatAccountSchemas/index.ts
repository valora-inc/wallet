import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getAccountNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/accountNumber'
import { getIbanNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/ibanNumber'
import { getIfscAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/ifscAccount'
import { getMobileMoneySchema } from 'src/fiatconnect/fiatAccountSchemas/mobileMoney'
import { getPixAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/pixAccount'
import {
  ComputedParam,
  FormFieldParam,
  ImplicitParam,
} from 'src/fiatconnect/fiatAccountSchemas/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import i18n from 'src/i18n'

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
    // should never happen
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
    case FiatAccountSchema.IBANNumber:
      return getIbanNumberSchema(
        {
          country,
          fiatAccountType,
        },
        schemaCountryOverrides
      )
    case FiatAccountSchema.MobileMoney:
      return getMobileMoneySchema({
        country,
        fiatAccountType,
      })
    case FiatAccountSchema.IFSCAccount:
      return getIfscAccountSchema({
        country,
        fiatAccountType,
      })
    case FiatAccountSchema.PIXAccount:
      return getPixAccountSchema()
    default:
      // should never happen
      throw new Error('Unsupported schema type')
  }
}

export const INSTITUTION_NAME_FIELD: FormFieldParam = {
  name: 'institutionName',
  label: i18n.t('fiatAccountSchema.institutionName.label'),
  validate: (input: string) => ({
    isValid: input.length > 0,
  }),
  placeholderText: i18n.t('fiatAccountSchema.institutionName.placeholderText'),
  keyboardType: 'default',
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

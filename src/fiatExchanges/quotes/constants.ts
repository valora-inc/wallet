import {
  FiatAccountSchema,
  FiatAccountSchemas,
  SupportedOperatorEnum,
} from '@fiatconnect/fiatconnect-types'

type DefaultAllowedValues = Partial<{
  [Schema in FiatAccountSchema]: {
    [Property in keyof Partial<FiatAccountSchemas[Schema]>]: string[]
  }
}>

export const DEFAULT_ALLOWED_VALUES: DefaultAllowedValues = {
  [FiatAccountSchema.MobileMoney]: {
    operator: Object.keys(SupportedOperatorEnum),
  },
}

import { FiatAccountSchema, SupportedOperatorEnum } from '@fiatconnect/fiatconnect-types'

export const DEFAULT_ALLOWED_VALUES: Partial<Record<FiatAccountSchema, Record<string, string[]>>> =
  {
    [FiatAccountSchema.MobileMoney]: {
      operator: Object.keys(SupportedOperatorEnum),
    },
  }

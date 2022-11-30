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

export enum SettlementTime {
  ONE_HOUR = 'ONE_HOUR',
  LESS_THAN_24_HOURS = 'LESS_THAN_24_HOURS',
  NUM_DAYS = 'NUM_DAYS',
}

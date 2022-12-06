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
  // List of available settlement time strings for SelectProvider and
  // TransferStatus screens
  LESS_THAN_ONE_HOUR = 'LESS_THAN_ONE_HOUR', // only for SelectProvider
  LESS_THAN_24_HOURS = 'LESS_THAN_24_HOURS',
  ONE_TO_THREE_DAYS = 'ONE_TO_THREE_DAYS',
}

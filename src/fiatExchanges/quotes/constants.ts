import {
  FiatAccountSchema,
  FiatAccountSchemas,
  PIXKeyTypeEnum,
} from '@fiatconnect/fiatconnect-types'

type DefaultAllowedValues = Partial<{
  [Schema in FiatAccountSchema]: {
    [Property in keyof Partial<FiatAccountSchemas[Schema]>]: string[]
  }
}>

export const DEFAULT_ALLOWED_VALUES: DefaultAllowedValues = {
  [FiatAccountSchema.PIXAccount]: {
    keyType: Object.keys(PIXKeyTypeEnum),
  },
}

export enum SettlementTime {
  // List of available settlement time strings for SelectProvider and
  // TransferStatus screens
  LESS_THAN_ONE_HOUR = 'LESS_THAN_ONE_HOUR',
  LESS_THAN_X_HOURS = 'LESS_THAN_X_HOURS',
  X_TO_Y_HOURS = 'X_TO_Y_HOURS',
  LESS_THAN_X_DAYS = 'LESS_THAN_X_DAYS',
  X_TO_Y_DAYS = 'X_TO_Y_DAYS',
}

export type SettlementEstimation =
  // Less than one hour is necessary because the text string uses the word "hour" instead of "hours"
  | {
      settlementTime: SettlementTime.LESS_THAN_ONE_HOUR
    }
  | {
      settlementTime: SettlementTime.LESS_THAN_X_HOURS | SettlementTime.LESS_THAN_X_DAYS
      upperBound: number
    }
  | {
      settlementTime: SettlementTime.X_TO_Y_HOURS | SettlementTime.X_TO_Y_DAYS
      lowerBound: number
      upperBound: number
    }

export const DEFAULT_BANK_SETTLEMENT_ESTIMATION: SettlementEstimation = {
  settlementTime: SettlementTime.X_TO_Y_DAYS,
  lowerBound: 1,
  upperBound: 3,
}

export const DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION: SettlementEstimation = {
  settlementTime: SettlementTime.LESS_THAN_X_HOURS,
  upperBound: 24,
}

export const DEFAULT_CARD_SETTLEMENT_ESTIMATION: SettlementEstimation = {
  settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
}

export const DEFAULT_AIRTIME_SETTLEMENT_ESTIMATION: SettlementEstimation = {
  settlementTime: SettlementTime.X_TO_Y_DAYS,
  lowerBound: 0,
  upperBound: 2,
}

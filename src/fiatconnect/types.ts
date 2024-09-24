import type { FiatAccountSchemas } from '@fiatconnect/fiatconnect-types'
import { InterpolationMap } from 'i18next'
import type Resources from 'src/i18n/i18next-resources'

type FiatAccountNumberTranslations = Resources['translation']['fiatAccountSchema']['accountNumber']

export interface FiatAccountSchemaCountryOverrides {
  [country: string]: {
    [Schema in keyof Partial<FiatAccountSchemas>]: {
      [Property in keyof Partial<FiatAccountSchemas[Schema]>]: {
        regex: string
        errorString: keyof FiatAccountNumberTranslations
        errorParams?: InterpolationMap<
          FiatAccountNumberTranslations[keyof FiatAccountNumberTranslations]
        >
      }
    }
  }
}

export class FiatConnectTxError extends Error {
  txPossiblyPending: boolean
  error: any

  constructor(message: string, txPossiblyPending: boolean, error: any) {
    super(message)
    this.txPossiblyPending = txPossiblyPending
    this.error = error
  }
}

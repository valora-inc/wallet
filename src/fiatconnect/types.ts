import { FiatAccountSchemas } from '@fiatconnect/fiatconnect-types'

export interface FiatAccountSchemaCountryOverrides {
  [country: string]: {
    [Schema in keyof Partial<FiatAccountSchemas>]: {
      [Property in keyof Partial<FiatAccountSchemas[Schema]>]: {
        regex: string
        errorString: string
        errorParams?: Record<string, any>
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

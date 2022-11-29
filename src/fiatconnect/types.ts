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

export class FiatConnectTransferOutError extends Error {
  txPossiblyPending: boolean
  error: any

  constructor(message: string, txPossiblyPending: boolean, error: any) {
    super(message)
    Object.setPrototypeOf(this, FiatConnectTransferOutError.prototype)
    this.txPossiblyPending = txPossiblyPending
    this.error = error
  }
}

import { FiatAccountSchema, FiatAccountSchemas } from '@fiatconnect/fiatconnect-types'

export interface FiatConnectSchemaCountryOverrides<T extends FiatAccountSchema> {
  [country: string]: {
    [Property in keyof Partial<FiatAccountSchemas[T]>]: {
      regex: string
      errorString: string
      errorParams?: Record<string, any>
    }
  }
}

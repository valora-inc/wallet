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

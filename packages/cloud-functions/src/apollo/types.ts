import BigNumber from 'bignumber.js'

export type Maybe<T> = T | null

/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  Address: string
  Timestamp: number
  Decimal: BigNumber.Value
  Upload: any
}

export interface ExchangeRate {
  __typename?: 'ExchangeRate'
  rate: Scalars['Decimal']
}

export interface Query {
  __typename?: 'Query'
  currencyConversion?: Maybe<ExchangeRate>
}

export interface QueryCurrencyConversionArgs {
  sourceCurrencyCode?: Maybe<Scalars['String']>
  currencyCode: Scalars['String']
  timestamp?: Maybe<Scalars['Timestamp']>
}

export interface ExchangeRateQueryVariables {
  sourceCurrencyCode?: Maybe<Scalars['String']>
  currencyCode: Scalars['String']
}

export interface ExchangeRateQuery {
  __typename?: 'Query'
  currencyConversion: Maybe<{ __typename?: 'ExchangeRate'; rate: BigNumber.Value }>
}

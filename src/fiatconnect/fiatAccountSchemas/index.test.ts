import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getSchema } from 'src/fiatconnect/fiatAccountSchemas'
import { getAccountNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/accountNumber'
import { getIbanNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/ibanNumber'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'

jest.mock('src/fiatconnect/fiatAccountSchemas/accountNumber', () => ({
  getAccountNumberSchema: jest.fn(() => 'account-number-schema'),
}))

jest.mock('src/fiatconnect/fiatAccountSchemas/ibanNumber', () => ({
  getIbanNumberSchema: jest.fn(() => 'iban-number-schema'),
}))

describe(getSchema, () => {
  const params: {
    fiatAccountSchema: FiatAccountSchema
    country: string | null
    fiatAccountType: FiatAccountType
    schemaCountryOverrides: FiatAccountSchemaCountryOverrides
  } = {
    fiatAccountSchema: FiatAccountSchema.AccountNumber,
    country: 'GB',
    fiatAccountType: FiatAccountType.BankAccount,
    schemaCountryOverrides: {
      GB: {},
    },
  }
  it('throws an error when country is null', () => {
    expect(() =>
      getSchema({
        ...params,
        country: null,
      })
    ).toThrow()
  })
  it('throws an error when there is an unsupported schema type', () => {
    expect(() =>
      getSchema({
        ...params,
        fiatAccountSchema: FiatAccountSchema.MobileMoney,
      })
    ).toThrow()
  })
  it('calls getAccountNumberSchema for  AccountNumber schema', () => {
    const schema = getSchema(params)
    expect(getAccountNumberSchema).toHaveBeenCalledWith(
      {
        country: params.country,
        fiatAccountType: params.fiatAccountType,
      },
      params.schemaCountryOverrides
    )
    expect(schema).toEqual('account-number-schema')
  })
  it('calls getIbanNumberSchema for IbanNumber schema', () => {
    const schema = getSchema({
      ...params,
      fiatAccountSchema: FiatAccountSchema.IBANNumber,
    })
    expect(getIbanNumberSchema).toHaveBeenCalledWith(
      {
        country: params.country,
        fiatAccountType: params.fiatAccountType,
      },
      params.schemaCountryOverrides
    )
    expect(schema).toEqual('iban-number-schema')
  })
})

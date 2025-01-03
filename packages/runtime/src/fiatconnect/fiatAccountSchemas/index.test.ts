import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getSchema } from 'src/fiatconnect/fiatAccountSchemas'
import { getAccountNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/accountNumber'
import { getIbanNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/ibanNumber'
import { getIfscAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/ifscAccount'
import { getMobileMoneySchema } from 'src/fiatconnect/fiatAccountSchemas/mobileMoney'
import { getPixAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/pixAccount'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'

jest.mock('src/fiatconnect/fiatAccountSchemas/accountNumber', () => ({
  getAccountNumberSchema: jest.fn(() => 'account-number-schema'),
}))

jest.mock('src/fiatconnect/fiatAccountSchemas/ibanNumber', () => ({
  getIbanNumberSchema: jest.fn(() => 'iban-number-schema'),
}))

jest.mock('src/fiatconnect/fiatAccountSchemas/mobileMoney', () => ({
  getMobileMoneySchema: jest.fn(() => 'mobile-money-schema'),
}))

jest.mock('src/fiatconnect/fiatAccountSchemas/ifscAccount', () => ({
  getIfscAccountSchema: jest.fn(() => 'ifsc-account-schema'),
}))

jest.mock('src/fiatconnect/fiatAccountSchemas/pixAccount', () => ({
  getPixAccountSchema: jest.fn(() => 'pix-account-schema'),
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
  afterEach(() => {
    jest.clearAllMocks()
  })
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
        fiatAccountSchema: 'Foo' as FiatAccountSchema,
      })
    ).toThrow()
  })
  it('calls getAccountNumberSchema for AccountNumber schema', () => {
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
  it('calls getMobileMoneySchema for MobileMoney schema', () => {
    const schema = getSchema({
      ...params,
      fiatAccountType: FiatAccountType.MobileMoney,
      fiatAccountSchema: FiatAccountSchema.MobileMoney,
    })
    expect(getMobileMoneySchema).toHaveBeenCalledWith({
      country: params.country,
      fiatAccountType: FiatAccountType.MobileMoney,
    })
    expect(schema).toEqual('mobile-money-schema')
  })
  it('calls getIfscAccountSchema for IfscAccount schema', () => {
    const schema = getSchema({
      ...params,
      fiatAccountSchema: FiatAccountSchema.IFSCAccount,
    })
    expect(getIfscAccountSchema).toHaveBeenCalledWith({
      country: params.country,
      fiatAccountType: params.fiatAccountType,
    })
    expect(schema).toEqual('ifsc-account-schema')
  })
  it('calls getPIXAccountSchema for PIXAccount schema', () => {
    const schema = getSchema({
      ...params,
      fiatAccountSchema: FiatAccountSchema.PIXAccount,
    })
    expect(getPixAccountSchema).toHaveBeenCalled()
    expect(schema).toEqual('pix-account-schema')
  })
})

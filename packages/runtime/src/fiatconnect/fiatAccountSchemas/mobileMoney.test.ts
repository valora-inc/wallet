import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getMobileMoneySchema } from 'src/fiatconnect/fiatAccountSchemas/mobileMoney'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

const validPhoneNumber = '+123456789'
const invalidPhoneNumber = '+1234567890123456789' // too long

describe('getMobileMoneySchema', () => {
  const { validate, format } = getMobileMoneySchema({
    country: 'US',
    fiatAccountType: FiatAccountType.MobileMoney,
  }).mobile as FormFieldParam
  it('validate fails on invalid input', () => {
    expect(validate(invalidPhoneNumber).isValid).toBeFalsy()
    // failure returns default error message
    expect(validate(invalidPhoneNumber).errorMessage).toEqual(
      'fiatAccountSchema.mobileMoney.mobile.errorMessage'
    )
  })
  it('validate succeeds on valid input', () => {
    expect(validate(validPhoneNumber).isValid).toBeTruthy()
    expect(validate(validPhoneNumber).errorMessage).toBeUndefined()
  })
  it('formatter adds "+" symbol', () => {
    //Doesn't add when text is empty
    expect(format!('')).toEqual('')
    expect(format!('12345')).toEqual('+12345')
  })
})

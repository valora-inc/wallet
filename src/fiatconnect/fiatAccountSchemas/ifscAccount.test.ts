import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getIfscAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/ifscAccount'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

describe('getIfscAccountSchema', () => {
  const schema = getIfscAccountSchema({
    country: 'IN',
    fiatAccountType: FiatAccountType.BankAccount,
  })

  describe('ifsc', () => {
    const { validate, format } = schema.ifsc as FormFieldParam

    it('validate fails on invalid input', () => {
      const { isValid, errorMessage } = validate('abcd01234')
      expect(isValid).toBeFalsy()
      expect(errorMessage).toEqual('fiatAccountSchema.ifsc.errorMessage')
    })
    it('validate succeeds on valid input', () => {
      const { isValid, errorMessage } = validate('ABCD0123456')
      expect(isValid).toBeTruthy()
      expect(errorMessage).toBeUndefined()
    })
    it('format converts to upper case', () => {
      expect(format!('')).toEqual('')
      expect(format!('12345')).toEqual('12345')
      expect(format!('abcd12345z')).toEqual('ABCD12345Z')
    })
  })

  describe('accountNumber', () => {
    const { validate } = schema.accountNumber as FormFieldParam

    it('validate fails on invalid input', () => {
      const { isValid, errorMessage } = validate('abcd01234')
      expect(isValid).toBeFalsy()
      expect(errorMessage).toEqual('fiatAccountSchema.accountNumber.errorMessageDigit')
    })
    it('validate succeeds on valid input', () => {
      const { isValid, errorMessage } = validate('123456')
      expect(isValid).toBeTruthy()
      expect(errorMessage).toBeUndefined()
    })
  })
})

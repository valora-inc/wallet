import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getAccountNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/accountNumber'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

describe(getAccountNumberSchema, () => {
  describe('accountNumber.validate', () => {
    const { validate } = getAccountNumberSchema({
      country: 'US',
      fiatAccountType: FiatAccountType.BankAccount,
    }).accountNumber as FormFieldParam
    it('fails on invalid input', () => {
      // special characters not allowed
      expect(validate('83274#').isValid).toBeFalsy()
      // alphabetic characters not allowed
      expect(validate('83274A38f').isValid).toBeFalsy()
      // empty input not allowed
      expect(validate('').isValid).toBeFalsy()
      // spaces in the middle not allowed
      expect(validate('834834 4343').isValid).toBeFalsy()
      // failure returns default error message
      expect(validate('834834 4343').errorMessage).toEqual(
        'fiatAccountSchema.accountNumber.errorMessageDigit'
      )
    })
    it('succeeds on valid input', () => {
      // Any numeric value valid
      expect(validate('83274').isValid).toBeTruthy()
      expect(validate('83274').isValid).toBeTruthy()
      expect(validate('83274382432432423').isValid).toBeTruthy()
      expect(validate('83274382432432423').errorMessage).toBeUndefined()
    })
    it('handles overrides', () => {
      const { validate: validateWithOverride } = getAccountNumberSchema(
        { country: 'US', fiatAccountType: FiatAccountType.BankAccount },
        {
          US: {
            [FiatAccountSchema.AccountNumber]: {
              // Hypothetical override looking for the exact string 123456
              accountNumber: {
                regex: '^123456A$',
                errorString: 'notExactMatch',
                errorParams: { expected: '123456A' },
              },
            },
          },
        }
      ).accountNumber as FormFieldParam

      const failure = validateWithOverride('123')
      expect(failure.isValid).toBeFalsy()
      expect(failure.errorMessage).toEqual(
        'fiatAccountSchema.accountNumber.notExactMatch, {"expected":"123456A"}'
      )

      const success = validateWithOverride('123456A')
      expect(success.isValid).toBeTruthy()
      expect(success.errorMessage).toBeUndefined()
    })
  })
})

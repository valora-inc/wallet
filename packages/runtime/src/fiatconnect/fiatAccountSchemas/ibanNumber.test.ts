import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getIbanNumberSchema } from 'src/fiatconnect/fiatAccountSchemas/ibanNumber'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

const validIbanNumber = 'GB29 NWBK 6016 1331 9268 19'
const invalidIbanNumber = 'GB94 BARC 2020 1530 0934 59' // fails checksum

describe(getIbanNumberSchema, () => {
  describe('ibanNumber.validate', () => {
    const { validate } = getIbanNumberSchema({
      country: 'US',
      fiatAccountType: FiatAccountType.BankAccount,
    }).iban as FormFieldParam
    it('fails on invalid input', () => {
      expect(validate(invalidIbanNumber).isValid).toBeFalsy()
      // failure returns default error message
      expect(validate(invalidIbanNumber).errorMessage).toEqual(
        'fiatAccountSchema.ibanNumber.errorMessage'
      )
    })
    it('succeeds on valid input', () => {
      expect(validate(validIbanNumber).isValid).toBeTruthy()
      expect(validate(validIbanNumber).errorMessage).toBeUndefined()
    })
    it('handles overrides', () => {
      const { validate: validateWithOverride } = getIbanNumberSchema(
        { country: 'US', fiatAccountType: FiatAccountType.BankAccount },
        {
          US: {
            [FiatAccountSchema.IBANNumber]: {
              // Hypothetical override looking for the exact string 123456
              iban: {
                regex: '^123456A$',
                errorString: 'notExactMatch',
                errorParams: { expected: '123456A' },
              },
            },
          },
        }
      ).iban as FormFieldParam

      const failure = validateWithOverride('123')
      expect(failure.isValid).toBeFalsy()
      expect(failure.errorMessage).toEqual(
        'fiatAccountSchema.ibanNumber.notExactMatch, {"expected":"123456A"}'
      )

      const success = validateWithOverride('123456A')
      expect(success.isValid).toBeTruthy()
      expect(success.errorMessage).toBeUndefined()
    })
  })
})

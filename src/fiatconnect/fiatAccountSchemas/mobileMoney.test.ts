import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getMobileMoneySchema } from 'src/fiatconnect/fiatAccountSchemas/mobileMoney'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

const validPhoneNumber = '+123456789'
const invalidPhoneNumber = '+1234567890123456789' // too long

describe(getMobileMoneySchema, () => {
  describe('ibanNumber.validate', () => {
    const { validate, format } = getMobileMoneySchema({
      country: 'US',
      fiatAccountType: FiatAccountType.MobileMoney,
    }).mobile as FormFieldParam
    it('fails on invalid input', () => {
      expect(validate(invalidPhoneNumber).isValid).toBeFalsy()
      // failure returns default error message
      expect(validate(invalidPhoneNumber).errorMessage).toEqual(
        'fiatAccountSchema.mobileMoney.mobile.errorMessage'
      )
    })
    it('succeeds on valid input', () => {
      expect(validate(validPhoneNumber).isValid).toBeTruthy()
      expect(validate(validPhoneNumber).errorMessage).toBeUndefined()
    })
    it('handles overrides', () => {
      const { validate: validateWithOverride } = getMobileMoneySchema(
        { country: 'US', fiatAccountType: FiatAccountType.MobileMoney },
        {
          US: {
            [FiatAccountSchema.MobileMoney]: {
              // Hypothetical override looking for the exact string 123456
              mobile: {
                regex: '^123456$',
                errorString: 'notExactMatch',
                errorParams: { expected: '123456' },
              },
            },
          },
        }
      ).mobile as FormFieldParam

      const failure = validateWithOverride('123')
      expect(failure.isValid).toBeFalsy()
      expect(failure.errorMessage).toEqual(
        'fiatAccountSchema.mobileMoney.mobile.notExactMatch, {"expected":"123456"}'
      )

      const success = validateWithOverride('123456')
      expect(success.isValid).toBeTruthy()
      expect(success.errorMessage).toBeUndefined()
    })
    it('formatter adds/removes "+" symbol', () => {
      expect(format!('')).toEqual('')
      expect(format!('12345')).toEqual('+12345')
      expect(format!('+')).toEqual('')
    })
  })
})

import { PIXKeyTypeEnum } from '@fiatconnect/fiatconnect-types'
import { getPixAccountSchema } from 'src/fiatconnect/fiatAccountSchemas/pixAccount'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'

describe('getPixAccountSchema', () => {
  const schema = getPixAccountSchema()

  describe('key', () => {
    const { isVisible, validate } = schema.key as FormFieldParam

    it('isVisible is true only if keyType is not empty', () => {
      expect(isVisible?.({})).toEqual(false)
      expect(isVisible?.({ keyType: '' })).toEqual(false)
      expect(isVisible?.({ keyType: PIXKeyTypeEnum.CPF })).toEqual(true)
    })

    it.each([
      PIXKeyTypeEnum.CPF,
      PIXKeyTypeEnum.EMAIL,
      PIXKeyTypeEnum.PHONE,
      PIXKeyTypeEnum.RANDOM,
    ])('validate fails for invalid %s', (keyType: PIXKeyTypeEnum) => {
      const { isValid, errorMessage } = validate('badInput', { keyType })
      expect(isValid).toEqual(false)
      expect(errorMessage).toEqual('fiatAccountSchema.pix.key.errorMessage')
    })

    it.each([
      [PIXKeyTypeEnum.CPF, '000.000.000-00'],
      [PIXKeyTypeEnum.EMAIL, 'goodEmail@domain.com'],
      [PIXKeyTypeEnum.PHONE, '12345678901'],
      [PIXKeyTypeEnum.RANDOM, 'ca2e0d3e-a7f0-4b84-b5da-d09c3e156d8c'],
    ])('validate succeeds for valid %s', (keyType: PIXKeyTypeEnum, input: string) => {
      const { isValid, errorMessage } = validate(input, { keyType })
      expect(isValid).toEqual(true)
      expect(errorMessage).toBeUndefined()
    })

    it('Invalid keyType will show error if pix key is also invalid', () => {
      const { isValid, errorMessage } = validate('badInput', { keyType: 'notValidPixKeyType' })
      expect(isValid).toEqual(false)
      expect(errorMessage).toEqual('fiatAccountSchema.pix.key.errorMessage')
    })
  })
})

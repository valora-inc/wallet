import {
  EMAIL_REGEX,
  FiatAccountSchema,
  FiatAccountType,
  PIXKeyTypeEnum,
  PIX_CPF_KEY_REGEX,
  PIX_PHONE_KEY_REGEX,
} from '@fiatconnect/fiatconnect-types'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
import { INSTITUTION_NAME_FIELD } from 'src/fiatconnect/fiatAccountSchemas'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import i18n from 'src/i18n'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/g

export const getPixAccountSchema = (): FiatAccountFormSchema<FiatAccountSchema.PIXAccount> => {
  const keyValidation = (input: string, fieldNamesToValues: Record<string, string>) => {
    const keyType = fieldNamesToValues['keyType'] as PIXKeyTypeEnum
    let regex: RegExp
    switch (keyType) {
      case PIXKeyTypeEnum.EMAIL:
        regex = EMAIL_REGEX
        break
      case PIXKeyTypeEnum.CPF:
        regex = PIX_CPF_KEY_REGEX
        break
      case PIXKeyTypeEnum.PHONE:
        regex = PIX_PHONE_KEY_REGEX
        break
      case PIXKeyTypeEnum.RANDOM:
        regex = UUID_REGEX
        break
      default:
        // Occurs when keyType isn't selected
        regex = /.*/g
    }

    const isValid = regex.test(input)
    const errorMessageText = i18n.t('fiatAccountSchema.pix.key.errorMessage')
    return {
      isValid,
      errorMessage: isValid ? undefined : errorMessageText,
    }
  }

  return {
    institutionName: INSTITUTION_NAME_FIELD,
    keyType: {
      name: 'keyType',
      label: i18n.t('fiatAccountSchema.pix.keyType.label'),
      placeholderText: '', //Unused field, always a dropdown
      validate: (input: string) => ({ isValid: !!input }),
      keyboardType: 'default',
    },
    key: {
      name: 'key',
      placeholderText: i18n.t('fiatAccountSchema.pix.key.placeholderText'),
      validate: keyValidation,
      keyboardType: 'default',
      isVisible: (fieldNamesToValues: Record<string, string>) => !!fieldNamesToValues['keyType'],
    },
    fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.BankAccount },
    accountName: {
      name: 'accountName',
      computeValue: ({ institutionName, key = '', keyType }) =>
        `${institutionName} (${getObfuscatedAccountNumber(key)})`,
    },
  }
}

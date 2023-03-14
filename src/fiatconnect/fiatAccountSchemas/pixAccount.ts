import {
  EMAIL_REGEX,
  FiatAccountSchema,
  FiatAccountType,
  PIXKeyTypeEnum,
  PIX_CPF_KEY_REGEX,
  PIX_PHONE_KEY_REGEX,
} from '@fiatconnect/fiatconnect-types'
import { getObfuscatedEmail } from 'src/fiatconnect'
import { INSTITUTION_NAME_FIELD } from 'src/fiatconnect/fiatAccountSchemas'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import i18n from 'src/i18n'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/g
const REGEXES: Record<PIXKeyTypeEnum, RegExp> = {
  [PIXKeyTypeEnum.CPF]: PIX_CPF_KEY_REGEX,
  [PIXKeyTypeEnum.EMAIL]: EMAIL_REGEX,
  [PIXKeyTypeEnum.PHONE]: PIX_PHONE_KEY_REGEX,
  [PIXKeyTypeEnum.RANDOM]: UUID_REGEX,
}
const DEFAULT_REGEX = new RegExp(
  Object.values(REGEXES)
    .map((regex) => regex.source)
    .join('|')
)

export const getPixAccountSchema = (): FiatAccountFormSchema<FiatAccountSchema.PIXAccount> => {
  const keyValidation = (input: string, fieldNamesToValues: Record<string, string>) => {
    const keyType = fieldNamesToValues['keyType']
    const regex = REGEXES[keyType as PIXKeyTypeEnum] ?? DEFAULT_REGEX
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
      computeValue: ({ institutionName, key = '' }) =>
        `${institutionName} (${getObfuscatedEmail(key)})`,
    },
  }
}

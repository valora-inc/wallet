import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
import { INSTITUTION_NAME_FIELD } from 'src/fiatconnect/fiatAccountSchemas'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import i18n from 'src/i18n'

export const getIfscAccountSchema = (implicitParams: {
  country: string
  fiatAccountType: FiatAccountType
}): FiatAccountFormSchema<FiatAccountSchema.IFSCAccount> => {
  const accountNumberValidator = (input: string) => {
    const isValid = /^[0-9]+$/.test(input)
    return {
      isValid,
      errorMessage: isValid
        ? undefined
        : i18n.t('fiatAccountSchema.accountNumber.errorMessageDigit'),
    }
  }

  const ifscValidator = (input: string) => {
    const isValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(input)
    return {
      isValid,
      errorMessage: isValid ? undefined : i18n.t('fiatAccountSchema.ifsc.errorMessage'),
    }
  }

  const ifscFormatter = (input: string) => {
    return input.toUpperCase()
  }

  return {
    institutionName: INSTITUTION_NAME_FIELD,
    ifsc: {
      name: 'ifsc',
      label: i18n.t('fiatAccountSchema.ifsc.label'),
      validate: ifscValidator,
      format: ifscFormatter,
      placeholderText: i18n.t('fiatAccountSchema.ifsc.placeholderText'),
      keyboardType: 'default',
    },
    accountNumber: {
      name: 'accountNumber',
      label: i18n.t('fiatAccountSchema.accountNumber.label'),
      validate: accountNumberValidator,
      placeholderText: i18n.t('fiatAccountSchema.accountNumber.placeholderText'),
      keyboardType: 'number-pad',
    },
    country: { name: 'country', value: implicitParams.country },
    fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.BankAccount },
    accountName: {
      name: 'accountName',
      computeValue: ({ institutionName, accountNumber }) =>
        `${institutionName} (${getObfuscatedAccountNumber(accountNumber!)})`,
    },
  }
}

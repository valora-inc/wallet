import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import i18n from 'src/i18n'

export const getAccountNumberSchema = (
  implicitParams: {
    country: string
    fiatAccountType: FiatAccountType
  },
  countryOverrides?: FiatAccountSchemaCountryOverrides
): FiatAccountFormSchema<FiatAccountSchema.AccountNumber> => {
  // NOTE: the schema for overrides supports overriding any field's regex or
  // errorMessage, but the below currently applies it to just the
  // `accountNumber` field in the `AccountNumber` schema.
  // This can be extended to support overriding other params and applied more
  // generically if more fields/schemas require it.
  const overrides = countryOverrides?.[implicitParams.country]?.[FiatAccountSchema.AccountNumber]

  return {
    institutionName: {
      name: 'institutionName',
      label: i18n.t('fiatAccountSchema.institutionName.label'),
      regex: /.+/,
      placeholderText: i18n.t('fiatAccountSchema.institutionName.placeholderText'),
      keyboardType: 'default',
    },
    accountNumber: {
      name: 'accountNumber',
      label: i18n.t('fiatAccountSchema.accountNumber.label'),
      regex: overrides?.accountNumber?.regex
        ? new RegExp(overrides.accountNumber.regex)
        : /^[0-9]+$/,
      placeholderText: i18n.t('fiatAccountSchema.accountNumber.placeholderText'),
      errorMessage: overrides?.accountNumber?.errorString
        ? i18n.t(
            `fiatAccountSchema.accountNumber.${overrides.accountNumber.errorString}`,
            overrides.accountNumber.errorParams
          )
        : i18n.t('fiatAccountSchema.accountNumber.errorMessageDigit'),
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

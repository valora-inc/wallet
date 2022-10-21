import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { validateIBAN } from 'ibantools'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
import { INSTITUTION_NAME_FIELD } from 'src/fiatconnect/fiatAccountSchemas'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import i18n from 'src/i18n'

export const getIbanNumberSchema = (
  implicitParams: {
    country: string
    fiatAccountType: FiatAccountType
  },
  countryOverrides?: FiatAccountSchemaCountryOverrides
): FiatAccountFormSchema<FiatAccountSchema.IBANNumber> => {
  const overrides = countryOverrides?.[implicitParams.country]?.[FiatAccountSchema.IBANNumber]
  // Ensure spaces/lower case don't lead to invalid input
  const clean = (input: string) => input.replace(/\s/g, '').toUpperCase()
  const ibanNumberValidator = (input: string) => {
    const cleanInput = clean(input)
    const isValid = overrides?.iban?.regex
      ? new RegExp(overrides.iban.regex).test(cleanInput)
      : validateIBAN(cleanInput).valid
    const errorMessageText = overrides?.iban?.errorString
      ? i18n.t(
          `fiatAccountSchema.ibanNumber.${overrides.iban.errorString}`,
          overrides.iban.errorParams
        )
      : i18n.t(`fiatAccountSchema.ibanNumber.errorMessage`)

    // If we want more descriptive error messages in the future we can look at
    // validateIBAN(cleanInput).errorCodes to show the user more helpful messages
    return {
      isValid,
      errorMessage: isValid ? undefined : errorMessageText,
    }
  }

  return {
    institutionName: INSTITUTION_NAME_FIELD,
    iban: {
      name: 'iban',
      label: i18n.t('fiatAccountSchema.ibanNumber.label'),
      validate: ibanNumberValidator,
      placeholderText: i18n.t('fiatAccountSchema.ibanNumber.placeholderText'),
      keyboardType: 'default',
    },
    country: { name: 'country', value: implicitParams.country },
    fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.BankAccount },
    accountName: {
      name: 'accountName',
      computeValue: ({ institutionName, iban = '' }) =>
        `${institutionName} (${getObfuscatedAccountNumber(clean(iban))})`,
    },
  }
}

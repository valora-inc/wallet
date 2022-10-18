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
  //Ensure spaces/lower case don't lead to invalid input
  const cleanInput = (input: string) => input.replace(/\s/g, '').toUpperCase()

  const ibanNumberValidator = (input: string) => {
    input = cleanInput(input)

    if (overrides?.iban?.regex) {
      const isValid = new RegExp(overrides.iban.regex).test(input)
      return {
        isValid,
        errorMessage: i18n.t(`fiatAccountSchema.ibanNumber.errorMessage`),
      }
    }

    const { valid, errorCodes } = validateIBAN(input)
    if (!valid && input.length) {
      switch (errorCodes?.[0]) {
        //Option to add more error messages depending on error codes
        default:
          return {
            isValid: valid,
            errorMessage: i18n.t(`fiatAccountSchema.ibanNumber.errorMessage`),
          }
      }
    }
    return {
      isValid: valid,
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
      computeValue: ({ institutionName, iban }) =>
        //TODO: should I use a different obfuscation method? The account number approach seems good enough.
        `${institutionName} (${getObfuscatedAccountNumber(cleanInput(iban!))})`,
    },
  }
}

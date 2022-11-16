import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { INSTITUTION_NAME_FIELD } from 'src/fiatconnect/fiatAccountSchemas'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import i18n from 'src/i18n'

export const getMobileMoneySchema = (
  implicitParams: {
    country: string
    fiatAccountType: FiatAccountType
  },
  countryOverrides?: FiatAccountSchemaCountryOverrides
): FiatAccountFormSchema<FiatAccountSchema.MobileMoney> => {
  const overrides = countryOverrides?.[implicitParams.country]?.[FiatAccountSchema.MobileMoney]
  const mobileValidator = (input: string) => {
    const regex = overrides?.mobile?.regex ? new RegExp(overrides.mobile.regex) : /^[0-9]{13,15}$/
    const isValid = regex.test(input) && input.length <= 15
    const errorMessageText = overrides?.mobile?.errorString
      ? i18n.t(
          `fiatAccountSchema.mobileMoney.mobile.${overrides.mobile.errorString}`,
          overrides.mobile.errorParams
        )
      : i18n.t('fiatAccountSchema.mobileMoney.mobile.errorMessage')
    return {
      isValid,
      errorMessage: isValid ? undefined : errorMessageText,
    }
  }

  const operatorValidtor = (input: string) => {
    return {
      isValid: true,
      errorMessage: undefined,
    }
  }

  return {
    operator: {
      name: 'operator',
      label: i18n.t('fiatAccountSchema.mobileMoney.operator.label'),
      placeholderText: i18n.t('fiatAccountSchema.mobileMoney.operator.placeholderText'),
      validate: operatorValidtor,
      keyboardType: 'default',
    },
    mobile: {
      name: 'mobile',
      label: i18n.t('fiatAccountSchema.mobileMoney.mobile.label'),
      validate: mobileValidator,
      placeholderText: i18n.t('fiatAccountSchema.mobileMoney.mobile.placeholderText'),
      keyboardType: 'number-pad',
    },
    country: { name: 'country', value: implicitParams.country },
    fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.MobileMoney },
    accountName: {
      name: 'accountName',
      computeValue: ({ institutionName, mobile }) =>
        //TODO: do I obfuscate mobile at all?
        `${institutionName} (${mobile})`,
    },
    institutionName: INSTITUTION_NAME_FIELD,
  }
}

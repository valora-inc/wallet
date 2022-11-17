import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
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
    const regex = overrides?.mobile?.regex ? new RegExp(overrides.mobile.regex) : /^[0-9+]+$/
    const isValid = regex.test(input) && input.length >= 4 && input.length <= 16
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

  const mobileFormatter = (input: string) => {
    if (input.length && input[0] != '+') {
      return `+${input}`
    } else if (input === '+') {
      return ''
    }
    return input
  }

  return {
    operator: {
      name: 'operator',
      label: i18n.t('fiatAccountSchema.mobileMoney.operator.label'),
      placeholderText: i18n.t('fiatAccountSchema.mobileMoney.operator.placeholderText'),
      validate: (input: string) => ({ isValid: !!input }),
      keyboardType: 'default',
    },
    mobile: {
      name: 'mobile',
      label: i18n.t('fiatAccountSchema.mobileMoney.mobile.label'),
      infoDialog: {
        title: i18n.t('fiatAccountSchema.mobileMoney.mobileDialog.title'),
        actionText: i18n.t('fiatAccountSchema.mobileMoney.mobileDialog.dismiss'),
        body: i18n.t('fiatAccountSchema.mobileMoney.mobileDialog.body'),
        testID: 'mobileMoneyMobileDialog',
      },
      format: mobileFormatter,
      validate: mobileValidator,
      placeholderText: i18n.t('fiatAccountSchema.mobileMoney.mobile.placeholderText'),
      keyboardType: 'number-pad',
    },
    country: { name: 'country', value: implicitParams.country },
    fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.MobileMoney },
    accountName: {
      name: 'accountName',
      computeValue: ({ operator, mobile = '' }) =>
        `${operator} (${getObfuscatedAccountNumber(mobile)})`,
    },
    institutionName: {
      name: 'institutionName',
      computeValue: ({ operator }) => `${operator}`,
    },
  }
}

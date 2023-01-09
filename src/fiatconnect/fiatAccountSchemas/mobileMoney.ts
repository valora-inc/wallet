import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { getObfuscatedAccountNumber } from 'src/fiatconnect'
import { FiatAccountFormSchema } from 'src/fiatconnect/fiatAccountSchemas/types'
import i18n from 'src/i18n'

export const getMobileMoneySchema = (implicitParams: {
  country: string
  fiatAccountType: FiatAccountType
}): FiatAccountFormSchema<FiatAccountSchema.MobileMoney> => {
  const mobileValidator = (input: string) => {
    //Phone numbers should start with a plus sign and be 6-15 digits long
    const regex = /^\+[0-9]{6,15}$/
    const isValid = regex.test(input)
    const errorMessageText = i18n.t('fiatAccountSchema.mobileMoney.mobile.errorMessage')
    return {
      isValid,
      errorMessage: isValid ? undefined : errorMessageText,
    }
  }

  const mobileFormatter = (input: string) => {
    if (input.length && input[0] !== '+') {
      return `+${input}`
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
      },
      format: mobileFormatter,
      validate: mobileValidator,
      placeholderText: i18n.t('fiatAccountSchema.mobileMoney.mobile.placeholderText'),
      keyboardType: 'phone-pad',
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
      computeValue: ({ operator = '' }) => operator,
    },
  }
}

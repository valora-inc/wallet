import {
  FiatAccountSchema,
  FiatAccountSchemas,
  FiatAccountType,
} from '@fiatconnect/fiatconnect-types'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes } from 'src/components/Button'
import TextInput from 'src/components/TextInput'
import i18n from 'src/i18n'
import ForwardChevron from 'src/icons/ForwardChevron'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { FiatAccount, StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { getObfuscatedAccountNumber } from './index'
import Logger from '../utils/Logger'

const TAG = 'FiatDetailsScreen'

type ScreenProps = StackScreenProps<StackParamList, Screens.FiatDetailsScreen>

type Props = ScreenProps

export const SUPPORTED_FIAT_ACCOUNT_TYPES = new Set<FiatAccountType>([FiatAccountType.BankAccount])
// TODO: When we add support for more types be sure to add more unit tests to the FiatConnectQuotes class
export const SUPPORTED_FIAT_ACCOUNT_SCHEMAS = new Set<FiatAccountSchema>([
  FiatAccountSchema.AccountNumber,
])

interface FormFieldParam {
  name: string
  label: string
  regex: RegExp
  placeholderText: string
  errorMessage: string
}
interface ImplicitParam<T, K extends keyof T> {
  name: string
  value: T[K]
}

interface ComputedParam<T, K extends keyof T> {
  name: string
  computeValue: (otherFields: Partial<T>) => T[K]
}

type AccountNumberSchema = {
  [Property in keyof FiatAccountSchemas[FiatAccountSchema.AccountNumber]]:
    | FormFieldParam
    | ImplicitParam<FiatAccountSchemas[FiatAccountSchema.AccountNumber], Property>
    | ComputedParam<FiatAccountSchemas[FiatAccountSchema.AccountNumber], Property>
}

export function getAccountName({
  accountNumber,
  institutionName,
}: {
  accountNumber?: string
  institutionName?: string
}) {
  if (institutionName && accountNumber) {
    return `${institutionName} (${getObfuscatedAccountNumber(accountNumber)})`
  } else {
    // should never happen, since accountNumber and institutionName are required
    Logger.error(
      TAG,
      'Getting account name with falsy accountNumber and/or institutionName, defaulting to "Linked Account"'
    )
    return 'Linked account'
  }
}

const getAccountNumberSchema = (implicitParams: {
  country: string
  fiatAccountType: FiatAccountType
}): AccountNumberSchema => ({
  institutionName: {
    name: 'institutionName',
    label: i18n.t('fiatAccountSchema.institutionName.label'),
    regex: /.*?/,
    placeholderText: i18n.t('fiatAccountSchema.institutionName.placeholderText'),
    errorMessage: i18n.t('fiatAccountSchema.institutionName.errorMessage'),
  },
  accountNumber: {
    name: 'accountNumber',
    label: i18n.t('fiatAccountSchema.accountNumber.label'),
    regex: /^[0-9]{10}$/,
    placeholderText: i18n.t('fiatAccountSchema.accountNumber.placeholderText'),
    errorMessage: i18n.t('fiatAccountSchema.accountNumber.errorMessage'),
  },
  country: { name: 'country', value: implicitParams.country },
  fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.BankAccount },
  accountName: {
    name: 'accountName',
    computeValue: getAccountName,
  },
})

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { flow, quote } = route.params
  const [validInputs, setValidInputs] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [errors, setErrors] = useState(new Set<string>())
  const inputRefs = useRef<string[]>([textValue])
  const userCountry = useSelector(userLocationDataSelector)

  const fiatAccountSchema = quote.getFiatAccountSchema()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t('fiatDetailsScreen.header'),
    })
  }, [navigation])

  const getSchema = (fiatAccountSchema: FiatAccountSchema) => {
    switch (fiatAccountSchema) {
      case FiatAccountSchema.AccountNumber:
        return getAccountNumberSchema({
          country: userCountry.countryCodeAlpha2 || 'US',
          fiatAccountType: quote.getFiatAccountType(),
        })
      default:
        throw new Error('Unsupported schema type')
    }
  }

  function isFormFieldParam<T, K extends keyof T>(
    item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
  ): item is FormFieldParam {
    return 'errorMessage' in item
  }
  function isImplicitParam<T, K extends keyof T>(
    item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
  ): item is ImplicitParam<T, K> {
    return 'value' in item
  }
  function isComputedParam<T, K extends keyof T>(
    item: FormFieldParam | ImplicitParam<T, K> | ComputedParam<T, K>
  ): item is ComputedParam<T, K> {
    return 'computeValue' in item
  }

  const schema = getSchema(fiatAccountSchema)

  const formFields = useMemo(() => {
    const fields = Object.values(schema).filter(isFormFieldParam)
    for (let i = 0; i < fields.length; i++) {
      inputRefs.current.push('')
    }
    return fields
  }, [fiatAccountSchema])

  const implicitParameters = useMemo(() => {
    return Object.values(schema).filter(isImplicitParam)
  }, [fiatAccountSchema])

  const computedParameters = useMemo(() => {
    return Object.values(schema).filter(isComputedParam)
  }, [fiatAccountSchema])

  const onPressNext = async () => {
    validateInput()

    if (validInputs) {
      const body: Record<string, any> = {}
      for (let i = 0; i < formFields.length; i++) {
        body[formFields[i].name] = inputRefs.current[i]
      }

      implicitParameters.forEach((param) => {
        body[param.name] = param.value
      })

      computedParameters.forEach((param) => {
        body[param.name] = param.computeValue(body)
      })
      // await addNewFiatAccount(quote.getProviderBaseUrl(), fiatAccountSchema, body)
      //   .then((data) => {
      //     // TODO Tracking here
      //     dispatch(showMessage(t('fiatDetailsScreen.addFiatAccountSuccess')))
      //   })
      //   .catch((error) => {
      //     // TODO Tracking here
      //     if (error === FiatConnectError.ResourceExists) {
      //       dispatch(showError(ErrorMessages.ADD_FIAT_ACCOUNT_RESOURCE_EXIST))
      //     } else {
      //       dispatch(showError(t('fiatDetailsScreen.addFiatAccountFailed')))
      //     }
      //     Logger.error(TAG, `Error adding fiat account: ${error}`)
      //   })

      navigate(Screens.FiatConnectReview, {
        flow,
        normalizedQuote: quote,
        fiatAccount: body as FiatAccount,
      })
    }
  }

  const onPressSelectedPaymentOption = () => {
    // TODO: tracking here

    navigateBack()
  }

  const validateInput = () => {
    setValidInputs(false)
    const newErrorSet = new Set<string>()

    let hasEmptyFields = false
    formFields.forEach((field, index) => {
      const fieldVal = inputRefs.current[index].trim()

      if (!fieldVal) {
        hasEmptyFields = true
      } else if (!field.regex.test(fieldVal)) {
        newErrorSet.add(field.name)
      }
    })

    setErrors(newErrorSet)
    setValidInputs(!hasEmptyFields && newErrorSet.size === 0)
  }

  const setInputValue = (value: string, index: number) => {
    inputRefs.current[index] = value
    setTextValue(value)

    validateInput()
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {formFields.map((field, index) => {
          return (
            <View style={styles.inputView} key={`inputField-${index}`}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                testID={`input-${field.name}`}
                style={styles.formInput}
                value={inputRefs.current[index]}
                placeholder={field.placeholderText}
                onChangeText={(value) => setInputValue(value, index)}
              />
              {errors.has(field.name) && (
                <Text testID="errorMessage" style={styles.error}>
                  {field.errorMessage}
                </Text>
              )}
            </View>
          )
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.paymentOption}>
          <BorderlessButton onPress={onPressSelectedPaymentOption} testID="selectedProviderButton">
            <View style={styles.paymentOptionButton}>
              <Text style={styles.paymentOptionText}>
                {t('fiatDetailsScreen.selectedPaymentOption')}
              </Text>
              <ForwardChevron color={colors.gray4} />
              <Image
                source={{
                  uri: quote.getProviderLogo(),
                }}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
          </BorderlessButton>
        </View>
        <View>
          <Button
            testID="nextButton"
            text={t('next')}
            onPress={onPressNext}
            disabled={!validInputs}
            style={styles.nextButton}
            size={BtnSizes.FULL}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 24,
    paddingVertical: 4,
    flex: 1,
  },
  inputLabel: {
    ...fontStyles.regular500,
    paddingBottom: 4,
  },
  inputView: {
    paddingVertical: 12,
  },
  formInput: {
    ...fontStyles.regular,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    color: colors.dark,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  error: {
    fontSize: 12,
    color: '#FF0000', // color red
  },
  footer: {
    flex: 1,
    flexDirection: 'column',
    paddingBottom: 28,
  },
  paymentOption: {
    flex: 1,
    color: colors.gray2,
    marginBottom: 4,
    justifyContent: 'center',
  },
  paymentOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  paymentOptionText: {
    ...fontStyles.regular,
    color: colors.gray4,
    marginLeft: 16,
    paddingRight: 4,
  },
  iconImage: {
    marginLeft: 16,
    height: 48,
    width: 48,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
})
export default FiatDetailsScreen

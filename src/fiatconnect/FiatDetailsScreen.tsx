import {
  AccountNumber,
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
} from '@fiatconnect/fiatconnect-types'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes } from 'src/components/Button'
import TextInput from 'src/components/TextInput'
import { addNewFiatAccount } from 'src/fiatconnect'
import i18n from 'src/i18n'
import ForwardChevron from 'src/icons/ForwardChevron'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'FiatDetailsScreen'
type ScreenProps = StackScreenProps<StackParamList, Screens.FiatDetailsScreen>

type Props = ScreenProps

interface FormFieldParam {
  name: string
  label: string
  regex: RegExp
  placeholderText: string
  errorMessage: string
}
interface ImplicitFormFieldParam<T> {
  value: T
}

interface SchemaMetadata {
  [FiatAccountSchema.AccountNumber]: {
    [Property in keyof AccountNumber]:
      | FormFieldParam
      | ImplicitFormFieldParam<AccountNumber[Property]>
  }
}

// This is a mapping between different fiat account schema to the metadata of the fields that need to be rendered on the bank details screen
const SCHEMA_TO_FIELD_METADATA_MAP: SchemaMetadata = {
  [FiatAccountSchema.AccountNumber]: {
    accountName: {
      name: 'accountName',
      label: i18n.t('fiatAccountSchema.accountName.label'),
      regex: /.*?/,
      placeholderText: i18n.t('fiatAccountSchema.accountName.placeholderText'),
      errorMessage: i18n.t('fiatAccountSchema.accountName.errorMessage'),
    },
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
    country: { value: 'US' },
    fiatAccountType: { value: FiatAccountType.BankAccount },
  },
}

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { providerURL, fiatAccountSchema, cicoQuote, flow, provider } = route.params
  const [validInputs, setValidInputs] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [errors, setErrors] = useState(new Set<string>())
  const inputRefs = useRef<string[]>([textValue])
  const userCountry = useSelector(userLocationDataSelector)

  const dispatch = useDispatch()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t('fiatDetailsScreen.header'),
    })
  }, [navigation])

  const formFields = useMemo(() => {
    const fields: FormFieldParam[] = Object.values(
      SCHEMA_TO_FIELD_METADATA_MAP[fiatAccountSchema]
    ).filter((field): field is FormFieldParam => {
      // filter only the fields that are not implicit
      return 'errorMessage' in field
    })

    console.log('lisa fields', fields)
    for (let i = 0; i < fields.length; i++) {
      inputRefs.current.push('')
    }
    return fields
  }, [fiatAccountSchema])

  const implicitFields = (fiatAccountSchema: FiatAccountSchema) => {
    switch (fiatAccountSchema) {
      case FiatAccountSchema.AccountNumber:
        return {
          country: userCountry.countryCodeAlpha2,
          fiatAccountType: FiatAccountType.BankAccount,
        }
        break
      default:
        return {}
    }
  }

  const onPressNext = async () => {
    validateInput()

    if (validInputs) {
      const body: Record<string, string> = {}
      for (let i = 0; i < formFields.length; i++) {
        body[formFields[i].name] = inputRefs.current[i]
      }

      const completeBody = {
        ...body,
        ...implicitFields(fiatAccountSchema),
      }

      await addNewFiatAccount(providerURL, fiatAccountSchema, completeBody)
        .then((data) => {
          // TODO Tracking here
          dispatch(showMessage(t('fiatDetailsScreen.addFiatAccountSuccess')))
        })
        .catch((error) => {
          // TODO Tracking here
          if (error === FiatConnectError.ResourceExists) {
            dispatch(showError(ErrorMessages.ADD_FIAT_ACCOUNT_RESOURCE_EXIST))
          } else {
            dispatch(showError(t('fiatDetailsScreen.addFiatAccountFailed')))
          }
          Logger.error(TAG, `Error adding fiat account: ${error}`)
        })

      // TODO: navigate to the next screen
    }
  }

  const onPressSelectedPaymentOption = () => {
    // TODO: tracking here

    if (cicoQuote) {
      navigate(Screens.SelectProvider, {
        flow,
        selectedCrypto: cicoQuote.quote.cryptoType.toUpperCase() as Currency,
        amount: {
          crypto: parseInt(cicoQuote.quote.cryptoAmount),
          fiat: parseInt(cicoQuote.quote.fiatAmount),
        },
      })
    }
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
                  uri: 'jghgjhfk',
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

import {
  FiatAccountSchema,
  FiatAccountSchemas,
  FiatAccountType,
  FiatConnectError,
} from '@fiatconnect/fiatconnect-types'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, KeyboardType, StyleSheet, Text, View } from 'react-native'
import PickerSelect from 'react-native-picker-select'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TextInput, { LINE_HEIGHT } from 'src/components/TextInput'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import { fiatAccountUsed } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { getObfuscatedAccountNumber } from './index'

export const TAG = 'FIATCONNECT/FiatDetailsScreen'

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
  keyboardType: KeyboardType
}
interface ImplicitParam<T, K extends keyof T> {
  name: string
  value: T[K]
}

interface ComputedParam<T, K extends keyof T> {
  name: string
  computeValue: (otherFields: Partial<T>) => T[K]
}

type FiatAccountFormSchema<T extends FiatAccountSchema> = {
  [Property in keyof FiatAccountSchemas[T]]:
    | FormFieldParam
    | ImplicitParam<FiatAccountSchemas[T], Property>
    | ComputedParam<FiatAccountSchemas[T], Property>
}

const getAccountNumberSchema = (implicitParams: {
  country: string
  fiatAccountType: FiatAccountType
}): FiatAccountFormSchema<FiatAccountSchema.AccountNumber> => ({
  institutionName: {
    name: 'institutionName',
    label: i18n.t('fiatAccountSchema.institutionName.label'),
    regex: /.*?/,
    placeholderText: i18n.t('fiatAccountSchema.institutionName.placeholderText'),
    errorMessage: i18n.t('fiatAccountSchema.institutionName.errorMessage'),
    keyboardType: 'default',
  },
  accountNumber: {
    name: 'accountNumber',
    label: i18n.t('fiatAccountSchema.accountNumber.label'),
    regex: /^[0-9]{10}$/,
    placeholderText: i18n.t('fiatAccountSchema.accountNumber.placeholderText'),
    errorMessage: i18n.t('fiatAccountSchema.accountNumber.errorMessage'),
    keyboardType: 'number-pad',
  },
  country: { name: 'country', value: implicitParams.country },
  fiatAccountType: { name: 'fiatAccountType', value: FiatAccountType.BankAccount },
  accountName: {
    name: 'accountName',
    computeValue: ({ institutionName, accountNumber }) =>
      `${institutionName} (${getObfuscatedAccountNumber(accountNumber!)})`,
  },
})

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { flow, quote } = route.params
  const [isSending, setIsSending] = useState(false)
  const [validInputs, setValidInputs] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [errors, setErrors] = useState(new Set<string>())
  const inputRefs = useRef<string[]>([textValue])
  const userCountry = useSelector(userLocationDataSelector)
  const dispatch = useDispatch()

  const fiatAccountSchema = quote.getFiatAccountSchema()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={headerStyles.header}>
          <Text style={headerStyles.headerTitle} numberOfLines={1}>
            {t('fiatDetailsScreen.header')}
          </Text>
          <View style={styles.headerSubTitleContainer}>
            <View style={styles.headerImageContainer}>
              <Image
                style={styles.headerImage}
                source={{ uri: quote.getProviderIcon() }}
                resizeMode="contain"
              />
            </View>
            <Text numberOfLines={1} style={headerStyles.headerSubTitle}>
              {t('fiatDetailsScreen.headerSubTitle', { provider: quote.getProviderName() })}
            </Text>
          </View>
        </View>
      ),
      headerLeft: () => (
        <BackButton
          eventName={FiatExchangeEvents.cico_fiat_details_back}
          eventProperties={{
            flow,
            provider: quote.getProviderId(),
            fiatAccountSchema,
          }}
        />
      ),
      headerRight: () => (
        <CancelButton
          onCancel={() => {
            ValoraAnalytics.track(FiatExchangeEvents.cico_fiat_details_cancel, {
              flow: flow,
              provider: quote.getProviderId(),
              fiatAccountSchema,
            })
            navigate(Screens.FiatExchange)
          }}
          style={styles.cancelBtn}
        />
      ),
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
      setIsSending(true)
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

      const fiatAccountSchema = quote.getFiatAccountSchema()

      const fiatConnectClient = await getFiatConnectClient(
        quote.getProviderId(),
        quote.getProviderBaseUrl()
      )
      const result = await fiatConnectClient.addFiatAccount({
        fiatAccountSchema: fiatAccountSchema,
        data: body as FiatAccountSchemas[typeof fiatAccountSchema],
      })

      if (result.isOk) {
        dispatch(showMessage(t('fiatDetailsScreen.addFiatAccountSuccess')))
        ValoraAnalytics.track(FiatExchangeEvents.cico_fiat_details_success, {
          flow,
          provider: quote.getProviderId(),
          fiatAccountSchema,
        })
        // Record this fiat account as the most recently used
        const { fiatAccountId, fiatAccountType } = result.value
        dispatch(
          fiatAccountUsed({
            providerId: quote.getProviderId(),
            fiatAccountId,
            fiatAccountType,
            flow,
            cryptoType: quote.getCryptoType(),
            fiatType: quote.getFiatType(),
          })
        )
        navigate(Screens.FiatConnectReview, {
          flow,
          normalizedQuote: quote,
          fiatAccount: result.value,
        })
        setTimeout(() => setIsSending(false), 500)
      } else {
        setIsSending(false)
        Logger.error(
          TAG,
          `Error adding fiat account: ${result.error.fiatConnectError ?? result.error.message}`
        )
        ValoraAnalytics.track(FiatExchangeEvents.cico_fiat_details_error, {
          flow,
          provider: quote.getProviderId(),
          fiatAccountSchema,
          fiatConnectError: result.error.fiatConnectError,
          error: result.error.message,
        })
        if (result.error.fiatConnectError === FiatConnectError.ResourceExists) {
          dispatch(showError(ErrorMessages.ADD_FIAT_ACCOUNT_RESOURCE_EXIST))
        } else {
          dispatch(showError(t('fiatDetailsScreen.addFiatAccountFailed')))
        }
      }
    }
  }

  const validateInput = () => {
    setValidInputs(false)
    const newErrorSet = new Set<string>()

    let hasEmptyFields = false
    formFields.forEach((field, index) => {
      const fieldVal = inputRefs.current[index]?.trim()

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

  const allowedValues = quote.getFiatAccountSchemaAllowedValues()
  if (isSending) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainers}>
        <Text style={styles.descriptionText}>{t('fiatDetailsScreen.description')}</Text>
        {formFields.map((field, index) => {
          return (
            <View style={styles.inputView} key={`inputField-${index}`}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              {field.name in allowedValues ? (
                <PickerSelect
                  style={{
                    inputIOS: styles.formSelectInput,
                    inputAndroid: styles.formSelectInput,
                  }}
                  // NOTE: the below allows customizing the field to look
                  // similar to other free form text fields
                  useNativeAndroidPickerStyle={false}
                  onValueChange={(value) => {
                    setInputValue(value, index)
                  }}
                  placeholder={{ label: t('fiatDetailsScreen.selectItem'), value: null }}
                  items={allowedValues[field.name].map((item) => ({
                    label: item,
                    value: item,
                  }))}
                  doneText={t('fiatDetailsScreen.selectDone')}
                />
              ) : (
                <TextInput
                  testID={`input-${field.name}`}
                  style={styles.formInput}
                  value={inputRefs.current[index]}
                  placeholder={field.placeholderText}
                  onChangeText={(value) => setInputValue(value, index)}
                  keyboardType={field.keyboardType}
                />
              )}
              {errors.has(field.name) && (
                <Text testID="errorMessage" style={styles.error}>
                  {field.errorMessage}
                </Text>
              )}
            </View>
          )
        })}
      </KeyboardAwareScrollView>

      <Button
        testID="nextButton"
        text={t('next')}
        onPress={onPressNext}
        disabled={!validInputs}
        style={styles.nextButton}
        size={BtnSizes.FULL}
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainers: {
    paddingHorizontal: 16,
  },
  descriptionText: {
    ...fontStyles.regular,
    color: colors.gray4,
    paddingBottom: 12,
  },
  inputLabel: {
    ...fontStyles.regular500,
    paddingBottom: 4,
  },
  inputLabelActive: {
    color: colors.greenUI,
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
  formSelectInput: {
    ...fontStyles.regular,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    color: colors.dark,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 12,
    lineHeight: LINE_HEIGHT,
  },
  error: {
    fontSize: 12,
    color: '#FF0000', // color red
  },
  nextButton: {
    padding: variables.contentPadding,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    color: colors.gray4,
  },
  headerSubTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImageContainer: {
    height: 12,
    width: 12,
    marginRight: 6,
  },
  headerImage: {
    flex: 1,
  },
})
export default FiatDetailsScreen

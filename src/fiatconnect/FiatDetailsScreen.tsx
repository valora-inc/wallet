import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import PickerSelect from 'react-native-picker-select'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TextInput, { LINE_HEIGHT } from 'src/components/TextInput'
import {
  getSchema,
  isComputedParam,
  isFormFieldParam,
  isImplicitParam,
} from 'src/fiatconnect/fiatAccountSchemas'
import { FormFieldParam } from 'src/fiatconnect/fiatAccountSchemas/types'
import {
  schemaCountryOverridesSelector,
  sendingFiatAccountStatusSelector,
} from 'src/fiatconnect/selectors'
import { SendingFiatAccountStatus, submitFiatAccount } from 'src/fiatconnect/slice'
import Checkmark from 'src/icons/Checkmark'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

export const TAG = 'FIATCONNECT/FiatDetailsScreen'

type ScreenProps = StackScreenProps<StackParamList, Screens.FiatDetailsScreen>

type Props = ScreenProps

const SHOW_ERROR_DELAY_MS = 1500

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { flow, quote } = route.params
  const sendingFiatAccountStatus = useSelector(sendingFiatAccountStatusSelector)
  const [validInputs, setValidInputs] = useState(false)
  const [errors, setErrors] = useState(new Map<number, string | undefined>())
  const fieldValues = useRef<string[]>([])
  const { countryCodeAlpha2 } = useSelector(userLocationDataSelector)
  const dispatch = useDispatch()
  const schemaCountryOverrides = useSelector(schemaCountryOverridesSelector)

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
                testID="headerProviderIcon"
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
          testID="backButton"
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

  const schema = useMemo(
    () =>
      getSchema({
        fiatAccountSchema,
        country: countryCodeAlpha2,
        schemaCountryOverrides,
        fiatAccountType: quote.getFiatAccountType(),
      }),
    [fiatAccountSchema]
  )

  const formFields = useMemo(() => {
    const fields = Object.values(schema).filter(isFormFieldParam)
    for (let i = 0; i < fields.length; i++) {
      fieldValues.current.push('')
    }
    return fields
  }, [fiatAccountSchema])

  const implicitParameters = useMemo(() => {
    return Object.values(schema).filter(isImplicitParam)
  }, [fiatAccountSchema])

  const computedParameters = useMemo(() => {
    return Object.values(schema).filter(isComputedParam)
  }, [fiatAccountSchema])

  const onPressSubmit = async () => {
    validateInput()

    if (validInputs) {
      const body: Record<string, any> = {}
      for (let i = 0; i < formFields.length; i++) {
        body[formFields[i].name] = fieldValues.current[i]
      }

      implicitParameters.forEach((param) => {
        body[param.name] = param.value
      })
      computedParameters.forEach((param) => {
        body[param.name] = param.computeValue(body)
      })

      dispatch(
        submitFiatAccount({
          flow,
          quote,
          fiatAccountData: body,
        })
      )
    }
  }

  const validateInput = () => {
    setValidInputs(false)
    const newErrorMap = new Map<number, string | undefined>()

    formFields.forEach((field, index) => {
      const { isValid, errorMessage } = field.validate(fieldValues.current[index]?.trim())
      if (!isValid) {
        newErrorMap.set(index, errorMessage)
      }
    })

    setErrors(newErrorMap)
    setValidInputs(newErrorMap.size === 0)
  }

  const setInputValue = (value: string, index: number) => {
    fieldValues.current[index] = value
    validateInput()
  }

  const allowedValues = quote.getFiatAccountSchemaAllowedValues()
  switch (sendingFiatAccountStatus) {
    case SendingFiatAccountStatus.Sending:
      return (
        <View testID="spinner" style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color={colors.greenBrand} />
        </View>
      )
    case SendingFiatAccountStatus.KycApproved:
      return (
        <View testID="checkmark" style={styles.activityIndicatorContainer}>
          <Checkmark color={colors.greenBrand} />
        </View>
      )
    case SendingFiatAccountStatus.NotSending:
    default:
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <KeyboardAwareScrollView contentContainerStyle={styles.contentContainers}>
            <View>
              {formFields.map((field, index) => (
                <FormField
                  field={field}
                  index={index}
                  value={fieldValues.current[index]}
                  errorMessage={errors.get(index)}
                  onChange={(value) => {
                    setInputValue(value, index)
                  }}
                  allowedValues={allowedValues[field.name]}
                />
              ))}
            </View>
            <Button
              testID="submitButton"
              text={t('fiatDetailsScreen.submitAndContinue')}
              onPress={onPressSubmit}
              disabled={!validInputs}
              style={styles.submitButton}
              size={BtnSizes.FULL}
            />
          </KeyboardAwareScrollView>
          <KeyboardSpacer />
        </SafeAreaView>
      )
  }
}

function FormField({
  field,
  index,
  value,
  allowedValues,
  errorMessage,
  onChange,
}: {
  field: FormFieldParam
  index: number
  value: string
  allowedValues?: string[]
  errorMessage: string | undefined
  onChange: (value: any) => void
}) {
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()

  // Clear timeout on unmount to prevent memory leak warning
  useEffect(() => {
    return () => {
      if (typingTimer?.current) {
        clearTimeout(typingTimer.current)
      }
    }
  }, [])

  const onInputChange = (value: any) => {
    if (!showError) {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current)
      }
      typingTimer.current = setTimeout(() => {
        setShowError(true)
      }, SHOW_ERROR_DELAY_MS)
    }
    onChange(value)
  }

  return (
    <View style={styles.inputView} key={`inputField-${index}`}>
      <Text style={styles.inputLabel}>{field.label}</Text>
      {allowedValues ? (
        <PickerSelect
          style={{
            inputIOS: styles.formSelectInput,
            inputAndroid: styles.formSelectInput,
          }}
          // NOTE: the below allows customizing the field to look
          // similar to other free form text fields
          useNativeAndroidPickerStyle={false}
          onValueChange={onInputChange}
          placeholder={{ label: t('fiatDetailsScreen.selectItem'), value: null }}
          items={allowedValues.map((item) => ({
            label: item,
            value: item,
          }))}
          doneText={t('fiatDetailsScreen.selectDone')}
        />
      ) : (
        <TextInput
          testID={`input-${field.name}`}
          style={styles.formInputContainer}
          inputStyle={styles.formInput}
          value={value}
          placeholder={field.placeholderText}
          onChangeText={onInputChange}
          keyboardType={field.keyboardType}
          onBlur={() => {
            // set show error to true if field loses focus only if the field has
            // been typed at least once
            setShowError(!!typingTimer.current)
          }}
        />
      )}
      {errorMessage && showError && (
        <Text testID={`errorMessage-${field.name}`} style={styles.error}>
          {errorMessage}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainers: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  inputLabel: {
    ...fontStyles.regular500,
    paddingBottom: 4,
  },
  inputView: {
    paddingVertical: 12,
  },
  formInputContainer: {
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  formInput: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  formSelectInput: {
    ...fontStyles.regular,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    color: colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 12,
    lineHeight: LINE_HEIGHT,
  },
  error: {
    fontSize: 12,
    color: '#FF0000', // color red
  },
  submitButton: {
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

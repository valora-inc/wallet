import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import PickerSelect from 'react-native-picker-select'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import Dialog from 'src/components/Dialog'
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
import InfoIcon from 'src/icons/InfoIcon'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

export const TAG = 'FIATCONNECT/FiatDetailsScreen'

type ScreenProps = NativeStackScreenProps<StackParamList, Screens.FiatDetailsScreen>

type Props = ScreenProps

const SHOW_ERROR_DELAY_MS = 1500

const FiatDetailsScreen = ({ route, navigation }: Props) => {
  const { t } = useTranslation()
  const { flow, quote } = route.params
  const sendingFiatAccountStatus = useSelector(sendingFiatAccountStatusSelector)
  const [validInputs, setValidInputs] = useState(false)
  const [errors, setErrors] = useState(new Map<string, string | undefined>())
  const fieldNamesToValues = useRef<Record<string, string>>({})
  const { countryCodeAlpha2 } = useSelector(userLocationDataSelector)
  const dispatch = useDispatch()
  const schemaCountryOverrides = useSelector(schemaCountryOverridesSelector)

  const fiatAccountSchema = quote.getFiatAccountSchema()
  const fiatAccountType = quote.getFiatAccountType()

  const headerTitle = useMemo(() => {
    switch (fiatAccountType) {
      case FiatAccountType.BankAccount:
        return t('fiatDetailsScreen.headerBankAccount')
      case FiatAccountType.MobileMoney:
        return t('fiatDetailsScreen.headerMobileMoney')
      default:
        // should never happen
        throw new Error('Unsupported account type')
    }
  }, [fiatAccountType])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={headerStyles.header}>
          <Text style={headerStyles.headerTitle} numberOfLines={1}>
            {headerTitle}
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
            navigateHome()
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
    fields.forEach((field) => (fieldNamesToValues.current[field.name] = ''))
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
      formFields.forEach((formField) => {
        body[formField.name] = fieldNamesToValues.current[formField.name]
      })

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
    const newErrorMap = new Map<string, string | undefined>()

    formFields.forEach((field) => {
      if (field.format) {
        fieldNamesToValues.current[field.name] = field.format(
          fieldNamesToValues.current[field.name]
        )
      }
      const { isValid, errorMessage } = field.validate(
        fieldNamesToValues.current[field.name]?.trim(),
        fieldNamesToValues.current
      )
      if (!isValid) {
        newErrorMap.set(field.name, errorMessage)
      }
    })

    setErrors(newErrorMap)
    setValidInputs(newErrorMap.size === 0)
  }

  const setInputValue = ({ fieldName, value }: { fieldName: string; value: string }) => {
    fieldNamesToValues.current[fieldName] = value
    validateInput()
  }

  switch (sendingFiatAccountStatus) {
    case SendingFiatAccountStatus.Sending:
      return (
        <View testID="spinner" style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )
    case SendingFiatAccountStatus.KycApproved:
      return (
        <View testID="checkmark" style={styles.activityIndicatorContainer}>
          <Checkmark color={colors.primary} />
        </View>
      )
    case SendingFiatAccountStatus.NotSending:
    default:
      return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <KeyboardAwareScrollView contentContainerStyle={styles.contentContainers}>
            <View>
              {formFields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={fieldNamesToValues.current[field.name]}
                  errorMessage={errors.get(field.name)}
                  onChange={(fieldName, value) => {
                    setInputValue({ fieldName, value })
                  }}
                  allowedValues={quote.getFiatAccountSchemaAllowedValues(field.name)}
                  isVisible={field.isVisible?.(fieldNamesToValues.current) ?? true}
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
  value,
  allowedValues,
  errorMessage,
  isVisible,
  onChange,
}: {
  field: FormFieldParam
  value: string
  allowedValues?: string[]
  errorMessage: string | undefined
  isVisible: boolean
  onChange: (fieldName: string, value: any) => void
}) {
  const { t } = useTranslation()
  const [showError, setShowError] = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()
  const [infoVisibile, setInfoVisible] = useState(false)

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
    onChange(field.name, value)
  }

  if (!isVisible) {
    return <></>
  }

  return (
    <View style={styles.inputView} key={`inputField-${field.name}`}>
      <View style={styles.row}>
        {field.label && <Text style={styles.inputLabel}>{field.label}</Text>}
        {field.infoDialog && (
          <TouchableOpacity
            testID={`infoIcon-${field.name}`}
            onPress={() => setInfoVisible(true)}
            style={styles.infoIcon}
            hitSlop={variables.iconHitslop}
          >
            <InfoIcon size={18} color={colors.gray3} />
          </TouchableOpacity>
        )}
      </View>
      {field.infoDialog && (
        <Dialog
          testID={`dialog-${field.name}`}
          isVisible={infoVisibile}
          title={field.infoDialog.title}
          actionText={field.infoDialog.actionText}
          actionPress={() => {
            setInfoVisible(false)
          }}
        >
          {field.infoDialog.body}
        </Dialog>
      )}
      {allowedValues ? (
        <PickerSelect
          touchableWrapperProps={{ testID: `picker-${field.name}` }}
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
          doneText={t('fiatDetailsScreen.selectDone') ?? undefined}
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
    color: colors.black,
  },
  formSelectInput: {
    ...fontStyles.regular,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray2,
    marginBottom: 4,
    color: colors.black,
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
  infoIcon: {
    marginLeft: 5,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
  },
})
export default FiatDetailsScreen

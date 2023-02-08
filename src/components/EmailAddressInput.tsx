import { ValidatorKind } from '@celo/utils/lib/inputValidation'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { emailFormatValidator } from 'src/account/utils'
import FormField from 'src/components/FormField'
import FormTextInput from 'src/components/FormTextInput'
import ValidatedTextInput from 'src/components/ValidatedTextInput'

const TAG = 'EmailAddressInput'

interface Props {
  label: string
  style?: StyleProp<ViewStyle>
  email: string
  onChange?: (email: string) => void
  editable?: boolean
}

export default function EmailAddressInput({
  label,
  style,
  email,
  onChange,
  editable = true,
}: Props) {
  const emailInputRef = useRef<any>()
  const { t } = useTranslation()

  function onChangeEmail(emailAddress: string) {
    if (onChange) {
      onChange(emailAddress)
    }
  }

  return (
    <FormField style={[styles.container, style]} label={label}>
      <View style={styles.emailContainer}>
        <ValidatedTextInput
          forwardedRef={emailInputRef}
          InputComponent={FormTextInput}
          style={styles.emailAddressInput}
          value={email}
          placeholder={t('email')}
          keyboardType="email-address"
          testID="EmailAddressField"
          validator={ValidatorKind.Custom}
          customValidator={emailFormatValidator}
          onChangeText={onChangeEmail}
          editable={editable}
          showClearButton={true}
        />
      </View>
    </FormField>
  )
}

const styles = StyleSheet.create({
  container: {},
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  emailAddressInput: {
    flex: 1,
    marginLeft: 7,
  },
})

import { ValidatorKind } from '@celo/utils/lib/inputValidation'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { passwordFormatValidator } from 'src/account/utils'
import FormField from 'src/components/FormField'
import FormTextInput from 'src/components/FormTextInput'
import ValidatedTextInput from 'src/components/ValidatedTextInput'

const TAG = 'PasswordInput'

interface Props {
  label: string
  style?: StyleProp<ViewStyle>
  password: string
  onChange?: (password: string) => void
  editable?: boolean
}

export default function PasswordInput({
  label,
  style,
  password,
  onChange,
  editable = true,
}: Props) {
  const passwordInputRef = useRef<any>()
  const { t } = useTranslation()

  function onChangePassword(emailAddress: string) {
    if (onChange) {
      onChange(emailAddress)
    }
  }

  return (
    <FormField style={[styles.container, style]} label={label}>
      <View style={styles.emailContainer}>
        <ValidatedTextInput
          forwardedRef={passwordInputRef}
          InputComponent={FormTextInput}
          style={styles.passwordInput}
          value={password}
          placeholder={t('password')}
          keyboardType="default"
          secureTextEntry={true}
          testID="PasswordField"
          validator={ValidatorKind.Custom}
          customValidator={passwordFormatValidator}
          onChangeText={onChangePassword}
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
  passwordInput: {
    flex: 1,
    marginLeft: 7,
  },
})

import React from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Card from 'src/components/Card'
import TextInput from 'src/components/TextInput'
import AttentionIcon from 'src/icons/Attention'
import Checkmark from 'src/icons/Checkmark'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export enum CodeInputStatus {
  Inputting = 'Inputting', // input enabled
  Processing = 'Processing', // code validated, now trying to send it
  Error = 'Error', // the code processing failed and it's waiting to be input again.
  Accepted = 'Accepted', // the code has been accepted and completed
}

interface Props {
  status: CodeInputStatus
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  testID?: string
  style?: StyleProp<ViewStyle>
  autoFocus?: boolean
}

export default function CodeInput({
  status,
  inputValue,
  inputPlaceholder,
  onInputChange,
  testID,
  style,
  autoFocus,
}: Props) {
  const showInput = status === CodeInputStatus.Inputting || status === CodeInputStatus.Error
  const showSpinner = status === CodeInputStatus.Processing
  const showCheckmark = status === CodeInputStatus.Accepted
  const showError = status === CodeInputStatus.Error
  const showStatus = showCheckmark || showSpinner || showError

  const textColorForStatus = {
    [CodeInputStatus.Inputting]: colors.black,
    [CodeInputStatus.Processing]: colors.gray3,
    [CodeInputStatus.Error]: colors.error,
    [CodeInputStatus.Accepted]: colors.successDark,
  }
  return (
    <Card rounded={true} shadow={null} style={[styles.container, style]}>
      {showStatus && <View style={styles.statusContainer} />}
      <View style={styles.innerContent}>
        {showInput ? (
          <TextInput
            textContentType={'oneTimeCode'}
            showClearButton={false}
            value={inputValue}
            placeholder={inputPlaceholder}
            onChangeText={onInputChange}
            // This disables keyboard suggestions on iOS, but unfortunately NOT on Android
            // Though `InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS` is correctly set on the native input,
            // most Android keyboards ignore it :/
            autoCorrect={false}
            keyboardType={'number-pad'}
            inputStyle={{
              ...typeScale.bodyLarge,
              textAlign: 'center',
              minHeight: undefined,
              color: textColorForStatus[status],
            }}
            autoCapitalize="none"
            autoFocus={autoFocus}
            testID={testID}
          />
        ) : (
          <Text style={[styles.codeValue, { color: textColorForStatus[status] }]} numberOfLines={1}>
            {inputValue || ' '}
          </Text>
        )}
      </View>
      {showStatus && (
        <View style={styles.statusContainer}>
          {showSpinner && <ActivityIndicator size="small" color={colors.primary} />}
          {showCheckmark && <Checkmark testID={testID ? `${testID}/CheckIcon` : undefined} />}

          {showError && (
            <AttentionIcon
              color={colors.error}
              testId={testID ? `${testID}/ErrorIcon` : undefined}
              size={20}
            />
          )}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    overflow: 'hidden',
    backgroundColor: colors.gray1,
    borderWidth: 1,
    borderColor: colors.gray2,
  },
  innerContent: {
    flex: 1,
  },
  codeValue: {
    ...typeScale.bodyLarge,
    textAlign: 'center',
    paddingVertical: Spacing.Small12,
  },
  statusContainer: {
    width: 32,
    marginLeft: 4,
  },
})

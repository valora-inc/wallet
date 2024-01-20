import React, { useLayoutEffect } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import Card from 'src/components/Card'
import ClipboardAwarePasteButton from 'src/components/ClipboardAwarePasteButton'
import TextInput, { LINE_HEIGHT } from 'src/components/TextInput'
import Checkmark from 'src/icons/Checkmark'
import InfoIcon from 'src/icons/InfoIcon'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import { useClipboard } from 'src/utils/useClipboard'

export enum CodeInputStatus {
  Disabled = 'Disabled', // input disabled
  Inputting = 'Inputting', // input enabled
  Received = 'Received', // code received, still not validated
  Processing = 'Processing', // code validated, now trying to send it
  Error = 'Error', // the code processing failed and it's waiting to be input again.
  Accepted = 'Accepted', // the code has been accepted and completed
}

export interface Props {
  label?: string | null
  status: CodeInputStatus
  inputValue: string
  inputPlaceholder: string
  inputPlaceholderWithClipboardContent?: string
  onInputChange: (value: string) => void
  shouldShowClipboard: (value: string) => boolean
  multiline?: boolean
  numberOfLines?: number
  testID?: string
  style?: StyleProp<ViewStyle>
  shortVerificationCodesEnabled?: boolean
  autoFocus?: boolean
}

export default function CodeInput({
  label,
  status,
  inputValue,
  inputPlaceholder,
  inputPlaceholderWithClipboardContent,
  onInputChange,
  shouldShowClipboard,
  multiline,
  numberOfLines,
  testID,
  style,
  shortVerificationCodesEnabled = true,
  autoFocus,
}: Props) {
  const [forceShowingPasteIcon, clipboardContent, getFreshClipboardContent] = useClipboard()

  // LayoutAnimation when switching to/from input
  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [status === CodeInputStatus.Inputting])

  function shouldShowClipboardInternal() {
    if (forceShowingPasteIcon) {
      return true
    }
    return (
      !inputValue.toLowerCase().startsWith(clipboardContent.toLowerCase()) &&
      shouldShowClipboard(clipboardContent)
    )
  }

  const showInput = status === CodeInputStatus.Inputting || status === CodeInputStatus.Error
  const showSpinner = status === CodeInputStatus.Processing || status === CodeInputStatus.Received
  const showCheckmark = status === CodeInputStatus.Accepted
  const showError = status === CodeInputStatus.Error
  const showStatus = showCheckmark || showSpinner || showError
  const keyboardType = shortVerificationCodesEnabled
    ? 'number-pad'
    : Platform.OS === 'android'
      ? 'visible-password'
      : undefined

  return (
    <Card
      rounded={true}
      shadow={showInput ? Shadow.SoftLight : null}
      style={[showInput ? styles.containerActive : styles.container, style]}
    >
      {/* These views cannot be combined as it will cause the shadow to be clipped on iOS */}
      <View style={styles.containRadius}>
        <View
          style={[
            showInput
              ? shortVerificationCodesEnabled
                ? styles.contentActive
                : styles.contentActiveLong
              : shortVerificationCodesEnabled
                ? styles.content
                : styles.contentLong,
            showInput && shortVerificationCodesEnabled && label ? { paddingBottom: 4 } : undefined,
          ]}
        >
          {showStatus && shortVerificationCodesEnabled && <View style={styles.statusContainer} />}
          <View style={styles.innerContent}>
            {label && (
              <Text
                style={
                  showInput
                    ? shortVerificationCodesEnabled
                      ? styles.labelActive
                      : styles.labelActiveLong
                    : shortVerificationCodesEnabled
                      ? styles.label
                      : styles.labelLong
                }
              >
                {label}
              </Text>
            )}

            {showInput ? (
              <TextInput
                textContentType={shortVerificationCodesEnabled ? 'oneTimeCode' : undefined}
                showClearButton={false}
                value={inputValue}
                placeholder={
                  inputPlaceholderWithClipboardContent && shouldShowClipboardInternal()
                    ? inputPlaceholderWithClipboardContent
                    : inputPlaceholder
                }
                onChangeText={onInputChange}
                multiline={multiline}
                // This disables keyboard suggestions on iOS, but unfortunately NOT on Android
                // Though `InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS` is correctly set on the native input,
                // most Android keyboards ignore it :/
                autoCorrect={false}
                // On Android, the only known hack for now to disable keyboard suggestions
                // is to set the keyboard type to 'visible-password' which sets `InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD`
                // on the native input. Though it doesn't work in all cases (see https://stackoverflow.com/a/33227237/158525)
                // and has the unfortunate drawback of breaking multiline autosize.
                // We use numberOfLines to workaround this last problem.
                keyboardType={keyboardType}
                // numberOfLines is currently Android only on TextInput
                // workaround is to set the minHeight on iOS :/
                numberOfLines={Platform.OS === 'ios' ? undefined : numberOfLines}
                inputStyle={{
                  ...(shortVerificationCodesEnabled && {
                    ...fontStyles.large,
                    textAlign: 'center',
                  }),
                  minHeight:
                    Platform.OS === 'ios' && numberOfLines
                      ? LINE_HEIGHT * numberOfLines
                      : undefined,
                }}
                autoCapitalize="none"
                autoFocus={autoFocus}
                testID={testID}
              />
            ) : (
              <Text
                style={shortVerificationCodesEnabled ? styles.codeValue : styles.codeValueLong}
                numberOfLines={1}
              >
                {inputValue || ' '}
              </Text>
            )}
          </View>
          {showStatus && (
            <View style={styles.statusContainer}>
              {showSpinner && <ActivityIndicator size="small" color={colors.primary} />}
              {showCheckmark && <Checkmark testID={testID ? `${testID}/CheckIcon` : undefined} />}
              {showError && (
                <InfoIcon
                  color={colors.error}
                  testID={testID ? `${testID}/ErrorIcon` : undefined}
                />
              )}
            </View>
          )}
        </View>
        {showInput && (
          <ClipboardAwarePasteButton
            getClipboardContent={getFreshClipboardContent}
            shouldShow={shouldShowClipboardInternal()}
            onPress={onInputChange}
          />
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: 'rgba(103, 99, 86, 0.1)',
  },
  containerActive: {
    padding: 0,
  },
  // Applying overflow 'hidden' to `Card` also hides its shadow
  // that's why we're using a separate container
  containRadius: {
    borderRadius: Spacing.Smallest8,
    overflow: 'hidden',
  },
  contentLong: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
  },
  contentActiveLong: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
  contentActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
  innerContent: {
    flex: 1,
  },
  labelLong: {
    ...fontStyles.label,
    color: colors.onboardingBrownLight,
    opacity: 0.5,
    marginBottom: 4,
  },
  labelActiveLong: {
    ...fontStyles.label,
  },
  codeValueLong: {
    ...fontStyles.regular,
    color: colors.onboardingBrownLight,
  },

  label: {
    ...fontStyles.label,
    color: colors.onboardingBrownLight,
    opacity: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  labelActive: {
    ...fontStyles.label,
    textAlign: 'center',
  },
  codeValue: {
    ...fontStyles.large,
    color: colors.onboardingBrownLight,
    textAlign: 'center',
    paddingVertical: Spacing.Small12,
  },
  statusContainer: {
    width: 32,
    marginLeft: 4,
  },
})

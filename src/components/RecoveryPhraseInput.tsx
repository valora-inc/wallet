import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Dimensions,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Card from 'src/components/Card'
import ClipboardAwarePasteButton from 'src/components/ClipboardAwarePasteButton'
import TextInput, { LINE_HEIGHT } from 'src/components/TextInput'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import { useClipboard } from 'src/utils/useClipboard'

export enum RecoveryPhraseInputStatus {
  Inputting = 'Inputting', // input enabled
  Processing = 'Processing', // code validated, now trying to send it
}

interface Props {
  status: RecoveryPhraseInputStatus
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  shouldShowClipboard: (value: string) => boolean
}

const AVERAGE_WORD_WIDTH = 80
const AVERAGE_SEED_WIDTH = AVERAGE_WORD_WIDTH * 24
// Estimated number of lines needed to enter the Recovery Phrase
const NUMBER_OF_LINES = Math.ceil(AVERAGE_SEED_WIDTH / Dimensions.get('window').width)

const testID = 'ImportWalletBackupKeyInputField'

export default function RecoveryPhraseInput({
  status,
  inputValue,
  inputPlaceholder,
  onInputChange,
  shouldShowClipboard,
}: Props) {
  const [forceShowingPasteIcon, clipboardContent, getFreshClipboardContent] = useClipboard()
  const { t } = useTranslation()
  // LayoutAnimation when switching to/from input
  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [status === RecoveryPhraseInputStatus.Inputting])

  function shouldShowClipboardInternal() {
    if (forceShowingPasteIcon) {
      return true
    }
    return (
      !inputValue.toLowerCase().startsWith(clipboardContent.toLowerCase()) &&
      shouldShowClipboard(clipboardContent)
    )
  }

  const showInput = status === RecoveryPhraseInputStatus.Inputting
  const showStatus = status === RecoveryPhraseInputStatus.Processing
  const keyboardType = Platform.OS === 'android' ? 'visible-password' : undefined

  return (
    <Card
      rounded={true}
      shadow={showInput ? Shadow.SoftLight : null}
      style={[showInput ? styles.containerActive : styles.container]}
    >
      {/* These views cannot be combined as it will cause the shadow to be clipped on iOS */}
      <View style={styles.containRadius}>
        <View style={[showInput ? styles.contentActiveLong : styles.contentLong]}>
          <View style={styles.innerContent}>
            <Text style={showInput ? styles.labelActiveLong : styles.labelLong}>
              {t('accountKey')}
            </Text>
            {showInput ? (
              <TextInput
                showClearButton={false}
                value={inputValue}
                placeholder={inputPlaceholder}
                onChangeText={onInputChange}
                multiline={true}
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
                numberOfLines={Platform.OS === 'ios' ? undefined : NUMBER_OF_LINES}
                inputStyle={{
                  minHeight:
                    Platform.OS === 'ios' && NUMBER_OF_LINES
                      ? LINE_HEIGHT * NUMBER_OF_LINES
                      : undefined,
                }}
                autoCapitalize="none"
                testID={testID}
              />
            ) : (
              <Text style={styles.codeValueLong} numberOfLines={1}>
                {inputValue || ' '}
              </Text>
            )}
          </View>
          {showStatus && (
            <View style={styles.statusContainer}>
              {showStatus && <ActivityIndicator size="small" color={colors.primary} />}
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
  statusContainer: {
    width: 32,
    marginLeft: 4,
  },
})

import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native'
import { isValidBackupPhrase } from 'src/backup/utils'
import Touchable from 'src/components/Touchable'
import withTextInputPasteAware from 'src/components/WithTextInputPasteAware'
import { withTranslation } from 'src/i18n'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import Logger from 'src/utils/Logger'

const PhraseInput = withTextInputPasteAware(TextInput, { top: undefined, right: 12, bottom: 12 })

type TwelveWordTableProps = {
  words: string[]
}

function TwelveWordTable({ words }: TwelveWordTableProps) {
  return (
    <>
      {words.map((word, index) => (
        <View key={index} style={styles.indexWordContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
          <Text key={index} style={styles.wordText}>
            {word}
          </Text>
        </View>
      ))}
    </>
  )
}

export enum BackupPhraseContainerMode {
  READONLY = 'READONLY',
  INPUT = 'INPUT',
}

export enum BackupPhraseType {
  BACKUP_KEY = 'BACKUP_KEY',
}

type Props = {
  value: string | null
  mode: BackupPhraseContainerMode
  type: BackupPhraseType
  index?: number // e.g. index of safeguard phrase
  showCopy?: boolean
  style?: ViewStyle
  onChangeText?: (value: string) => void
  includeHeader?: boolean
  testID?: string
  readOnlyStyle?: ViewStyle
} & WithTranslation

export class BackupPhraseContainer extends React.Component<Props> {
  onPressCopy = () => {
    const { value: words, t } = this.props
    if (!words) {
      return
    }
    Clipboard.setString(words)
    Logger.showMessage(t('copied'))
    vibrateInformative()
  }

  onPhraseInputChange = (value: string) => {
    if (this.props.onChangeText) {
      this.props.onChangeText(value)
    }
  }

  render() {
    const {
      t,
      value: words,
      showCopy,
      style,
      mode,
      type,
      includeHeader,
      testID,
      readOnlyStyle,
    } = this.props
    const wordList = words?.split(' ')
    const isTwelveWords = wordList?.length === 12

    return (
      <View style={style}>
        <View style={styles.headerContainer}>
          {type === BackupPhraseType.BACKUP_KEY && includeHeader !== false && (
            <View style={styles.writeDownKeyContainer}>
              <Text style={styles.writeDownKey}>{t('writeDownKeyExperimental')}</Text>
            </View>
          )}
          {showCopy && (
            <Touchable borderless={true} onPress={this.onPressCopy}>
              <Text style={styles.headerButton}>{this.props.t('copy')}</Text>
            </Touchable>
          )}
        </View>
        {mode === BackupPhraseContainerMode.READONLY && (
          <View
            style={{ ...styles.phraseContainer, ...readOnlyStyle }}
            testID="AccountKeyWordsContainer"
            accessibilityLabel={words ?? ''}
          >
            {isTwelveWords
              ? !!wordList && <TwelveWordTable words={wordList} />
              : !!words && <Text style={styles.phraseText}>{words}</Text>}
          </View>
        )}
        {mode === BackupPhraseContainerMode.INPUT && (
          <View style={styles.phraseInputContainer}>
            <PhraseInput
              style={[styles.phraseInputText]}
              value={words || ''}
              placeholder={t('backupPhrasePlaceholder') ?? undefined}
              onChangeText={this.onPhraseInputChange}
              shouldShowClipboard={isValidBackupPhrase}
              underlineColorAndroid="transparent"
              placeholderTextColor={colors.gray4}
              enablesReturnKeyAutomatically={true}
              multiline={true}
              autoCorrect={false}
              autoCapitalize={'none'}
              testID={testID}
            />
          </View>
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerButton: {
    ...fontStyles.regular,
  },
  writeDownKeyContainer: {
    flexDirection: 'column',
  },
  writeDownKey: {
    ...fontStyles.h2,
    marginBottom: 16,
  },
  indexText: {
    ...fontStyles.regular,
    color: colors.gray4,
    marginRight: 8,
    lineHeight: 24,
  },
  wordText: {
    ...fontStyles.regular,
    lineHeight: 24,
  },
  indexWordContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    marginVertical: 11,
    marginLeft: '3%',
  },
  phraseContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.beige,
    borderRadius: 8,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  phraseText: {
    ...fontStyles.regular,
    fontSize: 22,
    lineHeight: 32,
  },
  phraseInputContainer: {
    marginTop: 10,
  },
  phraseInputText: {
    ...fontStyles.regular,
    minHeight: 125,
    padding: 14,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
})

export default withTranslation<Props>()(BackupPhraseContainer)

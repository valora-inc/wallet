import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { mockMnemonic, mockTwelveWordMnemonic } from 'test/values'

describe('BackupPhraseContainer', () => {
  it('renders correctly for readonly backup 24-word phrase', () => {
    const tree = render(
      <BackupPhraseContainer
        value={mockMnemonic}
        mode={BackupPhraseContainerMode.READONLY}
        type={BackupPhraseType.BACKUP_KEY}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for readonly backup 12-word phrase', () => {
    const tree = render(
      <BackupPhraseContainer
        value={mockTwelveWordMnemonic}
        mode={BackupPhraseContainerMode.READONLY}
        type={BackupPhraseType.BACKUP_KEY}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for input backup phrase', () => {
    const tree = render(
      <BackupPhraseContainer
        value={mockMnemonic}
        mode={BackupPhraseContainerMode.INPUT}
        type={BackupPhraseType.BACKUP_KEY}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})

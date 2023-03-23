import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn().mockReturnValue({
    useNewBackupFlowCopy: false,
  }),
}))

describe('BackupIntroduction', () => {
  it('renders correctly when backup not complete', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore({})}>
        <BackupIntroduction {...getMockStackScreenProps(Screens.BackupIntroduction)} />
      </Provider>
    )

    expect(getByText('introTitle')).toBeTruthy()
    expect(getByText('introBody')).toBeTruthy()
    expect(getByTestId('SetUpAccountKey')).toBeTruthy()
  })

  it('renders correctly when backup not complete and using new backup flow', () => {
    ;(getExperimentParams as jest.Mock).mockReturnValueOnce({
      useNewBackupFlowCopy: true,
    })

    const { getByText, getByTestId } = render(
      <Provider store={createMockStore({})}>
        <BackupIntroduction {...getMockStackScreenProps(Screens.BackupIntroduction)} />
      </Provider>
    )

    expect(getByText('introBackUpPhrase')).toBeTruthy()
    expect(getByText('introCompleteQuiz')).toBeTruthy()
    expect(getByTestId('SetUpAccountKey')).toBeTruthy()
  })

  it('renders correctly when backup completed', () => {
    const { getByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupIntroduction {...getMockStackScreenProps(Screens.BackupIntroduction)} />
      </Provider>
    )

    expect(getByTestId('RecoveryPhraseContainer')).toBeTruthy()
    expect(getByText('postSetupBody')).toBeTruthy()
    expect(getByText('postSetupCTA')).toBeTruthy()
  })

  it('renders the drawer top bar', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupIntroduction
          {...getMockStackScreenProps(Screens.BackupIntroduction, { showDrawerTopBar: true })}
        />
      </Provider>
    )

    expect(getByTestId('BackupIntroduction/DrawerTopBar')).toBeTruthy()
  })
})

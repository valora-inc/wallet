import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import BackupPhrase from 'src/backup/BackupPhrase'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupPhrase', () => {
  it('renders correctly with backup not completed', () => {
    const tree = render(
      <Provider store={createMockStore()}>
        <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with backup completed', () => {
    const tree = render(
      <Provider store={createMockStore({ account: { backupCompleted: true } })}>
        <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('still renders when mnemonic doesnt show up', () => {
    const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock
    mockGetGenericPassword.mockResolvedValue(null)

    const tree = render(
      <Provider store={createMockStore({ account: { backupCompleted: true } })}>
        <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('pressing continue navigates to backup quiz when backup not completed', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
      </Provider>
    )

    expect(getByTestId('backupKeyContinue')).toBeDisabled()
    fireEvent(getByTestId('backupKeySavedSwitch'), 'onValueChange', true)
    expect(getByTestId('backupKeyContinue')).toBeEnabled()
    fireEvent.press(getByTestId('backupKeyContinue'))
    expect(navigate).toHaveBeenCalledWith(Screens.BackupQuiz, { isAccountRemoval: false })
  })

  it('pressing continue navigates to backup quiz when account removal', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ account: { backupCompleted: true } })}>
        <BackupPhrase
          {...getMockStackScreenProps(Screens.BackupPhrase, { isAccountRemoval: true })}
        />
      </Provider>
    )

    expect(getByTestId('backupKeyContinue')).toBeDisabled()
    fireEvent(getByTestId('backupKeySavedSwitch'), 'onValueChange', true)
    expect(getByTestId('backupKeyContinue')).toBeEnabled()
    fireEvent.press(getByTestId('backupKeyContinue'))
    expect(navigate).toHaveBeenCalledWith(Screens.BackupQuiz, { isAccountRemoval: true })
  })
})

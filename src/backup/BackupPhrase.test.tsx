import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import BackupPhrase from 'src/backup/BackupPhrase'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe.each([
  { settingsScreen: Screens.SettingsDrawer },
  { settingsScreen: Screens.Settings },
  {},
])('BackupPhrase (settingsScreen: $settingsScreen)', (routeParams) => {
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
})

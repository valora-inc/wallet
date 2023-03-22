import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import BackupPhrase from 'src/backup/BackupPhrase'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn().mockReturnValue({
    useNewBackupFlowCopy: false,
  }),
}))

it('renders correctly with backup not completed', () => {
  const tree = render(
    <Provider store={createMockStore()}>
      <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with backup not completed and using new backup flow copy', () => {
  ;(getExperimentParams as jest.Mock).mockReturnValueOnce({
    useNewBackupFlowCopy: true,
  })
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

it('renders correctly with backup completed and using new backup flow copy', () => {
  ;(getExperimentParams as jest.Mock).mockReturnValueOnce({
    useNewBackupFlowCopy: true,
  })
  const tree = render(
    <Provider store={createMockStore()}>
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

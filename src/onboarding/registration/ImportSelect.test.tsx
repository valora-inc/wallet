import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ImportSelect from 'src/onboarding/registration/ImportSelect'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')
const mockScreenProps = getMockStackScreenProps(Screens.ImportSelect)

describe('ImportSelect', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <ImportSelect {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('importSelect.title')).toBeTruthy()
    expect(getByText('importSelect.description')).toBeTruthy()
    expect(getByText('importSelect.emailAndPhone.title')).toBeTruthy()
    expect(getByText('importSelect.emailAndPhone.description')).toBeTruthy()
    expect(getByText('importSelect.recoveryPhrase.title')).toBeTruthy()
    expect(getByText('importSelect.recoveryPhrase.description')).toBeTruthy()
  })

  it('should be able to navigate to cloud restore', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <ImportSelect {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ImportSelect/CloudBackup'))
    expect(navigate).toHaveBeenCalledWith(Screens.SignInWithEmail, {
      keylessBackupFlow: KeylessBackupFlow.Restore,
    })
  })

  it('should be able to navigate to mnemonic restore', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <ImportSelect {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ImportSelect/Mnemonic'))
    expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet, { clean: true })
  })
})

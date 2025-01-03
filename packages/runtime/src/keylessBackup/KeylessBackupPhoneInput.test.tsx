import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import KeylessBackupPhoneInput from 'src/keylessBackup/KeylessBackupPhoneInput'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { noHeader } from 'src/navigator/Headers'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

describe('KeylessBackupPhoneInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('displays the correct components', () => {
    const { getByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: '+16505551111',
          },
        })}
      >
        <MockedNavigator
          component={KeylessBackupPhoneInput}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
            selectedCountryCodeAlpha2: 'US',
          }}
          options={noHeader}
        />
      </Provider>
    )
    expect(getByText('keylessBackupPhoneInput.setup.title')).toBeTruthy()
    expect(getByText('keylessBackupPhoneInput.setup.subtitle')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByTestId('KeylessBackupPhoneInput/Continue')).toBeTruthy()
    // not disabled because the phone number from store is valid
    expect(getByTestId('KeylessBackupPhoneInput/Continue')).not.toBeDisabled()
    expect(getByTestId('CancelButton')).toBeTruthy()
  })
  it('allows continue to be pressed when a valid phone number is entered', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          account: {
            e164PhoneNumber: null,
          },
        })}
      >
        <MockedNavigator
          component={KeylessBackupPhoneInput}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
            selectedCountryCodeAlpha2: 'NL',
          }}
        />
      </Provider>
    )

    expect(getByTestId('KeylessBackupPhoneInput/Continue')).toBeTruthy()
    expect(getByTestId('KeylessBackupPhoneInput/Continue')).toBeDisabled()
    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    expect(getByTestId('KeylessBackupPhoneInput/Continue')).not.toBeDisabled()
  })
})

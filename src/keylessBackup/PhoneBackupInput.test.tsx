import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import PhoneBackupInput from 'src/keylessBackup/PhoneBackupInput'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

describe('PhoneBackupInput', () => {
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
          component={PhoneBackupInput}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
            selectedCountryCodeAlpha2: 'US',
          }}
        />
      </Provider>
    )
    expect(getByText('signInWithPhone.title')).toBeTruthy()
    expect(getByText('signInWithPhone.subtitle')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByTestId('PhoneBackupInput/Continue')).toBeTruthy()
    // not disabled because the phone number from store is valid
    expect(getByTestId('PhoneBackupInput/Continue')).not.toBeDisabled()
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
          component={PhoneBackupInput}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
            selectedCountryCodeAlpha2: 'NL',
          }}
        />
      </Provider>
    )

    expect(getByTestId('PhoneBackupInput/Continue')).toBeTruthy()
    expect(getByTestId('PhoneBackupInput/Continue')).toBeDisabled()
    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    expect(getByTestId('PhoneBackupInput/Continue')).not.toBeDisabled()
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import LinkPhoneNumber from 'src/keylessBackup/LinkPhoneNumber'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/navigator/NavigationService')

describe('LinkPhoneNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to verification start screen', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <LinkPhoneNumber {...getMockStackScreenProps(Screens.LinkPhoneNumber)} />
      </Provider>
    )
    fireEvent.press(getByTestId('LinkPhoneNumberButton'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, {
      hideOnboardingStep: true,
    })
  })

  it('navigates to home on later', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <LinkPhoneNumber {...getMockStackScreenProps(Screens.LinkPhoneNumber)} />
      </Provider>
    )
    fireEvent.press(getByTestId('LinkPhoneNumberLater'))

    expect(navigateHome).toHaveBeenCalledTimes(1)
  })
})

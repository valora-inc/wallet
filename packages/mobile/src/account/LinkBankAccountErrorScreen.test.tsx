import { fireEvent, render } from '@testing-library/react-native'
import LinkBankAccountErrorScreen from './LinkBankAccountErrorScreen'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import * as React from 'react'

jest.mock('src/navigator/NavigationService', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
  navigate: jest.fn(),
  navigateBack: jest.fn(),
}))

describe('LinkBankAccountErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Navigates to contact support page when button is pressed', async () => {
    const { getByTestId } = render(<LinkBankAccountErrorScreen />)
    await fireEvent.press(getByTestId('SupportContactLink'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
      prefilledText: 'linkBankAccountScreen.error.contactSupportPrefill',
    })
  })

  it('Navigates back when Try Again is presed', async () => {
    const { getByTestId } = render(<LinkBankAccountErrorScreen />)
    await fireEvent.press(getByTestId('TryAgain'))
    expect(navigateBack).toHaveBeenCalled()
  })
})

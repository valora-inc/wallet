import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { LinkErrorCode, LinkErrorType } from 'react-native-plaid-link-sdk'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { getMockStackScreenProps } from 'test/utils'
import LinkBankAccountErrorScreen from './LinkBankAccountErrorScreen'

const mockError = new Error('some error')
const mockLinkError = {
  errorMessage: 'some error',
  errorCode: LinkErrorCode.INVALID_CREDENTIALS,
  errorType: LinkErrorType.BANK_TRANSFER,
}

const mockErrorProps = getMockStackScreenProps(Screens.LinkBankAccountErrorScreen, {
  error: mockError,
})
const mockLinkErrorProps = getMockStackScreenProps(Screens.LinkBankAccountErrorScreen, {
  error: mockLinkError,
})

jest.mock('src/navigator/NavigationService', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
  navigate: jest.fn(),
  navigateBack: jest.fn(),
}))

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('LinkBankAccountErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Navigates to contact support page when button is pressed', async () => {
    const { getByTestId } = render(<LinkBankAccountErrorScreen {...mockErrorProps} />)
    await fireEvent.press(getByTestId('SupportContactLink'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
      prefilledText: 'linkBankAccountScreen.stepTwo.error.contactSupportPrefill',
    })
    expect(Logger.warn).toHaveBeenCalledWith(
      'LinkBankAccountErrorScreen',
      'Error from IHL while adding bank account',
      mockError
    )
  })

  it('Navigates back when Try Again is presed', async () => {
    const { getByTestId } = render(<LinkBankAccountErrorScreen {...mockLinkErrorProps} />)
    await fireEvent.press(getByTestId('TryAgain'))
    expect(navigateBack).toHaveBeenCalled()
    expect(Logger.warn).toHaveBeenCalledWith(
      'LinkBankAccountErrorScreen',
      'Error from Plaid while adding bank account',
      mockLinkError
    )
  })
})

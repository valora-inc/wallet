import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ValidateRecipientIntro from 'src/send/ValidateRecipientIntro'
import { createMockStore } from 'test/utils'
import { mockEthTokenId, mockNavigation, mockTransactionData } from 'test/values'

const store = createMockStore()

const mockRoute = {
  name: Screens.ValidateRecipientIntro as Screens.ValidateRecipientIntro,
  key: '1',
  params: {
    transactionData: mockTransactionData,
    addressValidationType: AddressValidationType.FULL,
    origin: SendOrigin.AppSendFlow,
    recipient: mockTransactionData.recipient,
    defaultTokenIdOverride: mockEthTokenId,
  },
}

describe('ValidateRecipientIntro', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('navigates to account confirmation screen when Confirm Account button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('confirmAccountButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientAccount, {
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: mockEthTokenId,
      forceTokenId: undefined,
      requesterAddress: undefined,
      recipient: mockTransactionData.recipient,
    })
  })

  it('navigates to QR Scanner screen when Scan QR Code button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('scanQRCode'))
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        onQRCodeDetected: expect.any(Function),
        showSecureSendStyling: true,
      },
    })
  })
})

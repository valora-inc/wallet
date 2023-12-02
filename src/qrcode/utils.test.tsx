import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { View } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { showError } from 'src/alert/actions'
import { HooksEnablePreviewOrigin, SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handleEnableHooksPreviewDeepLink } from 'src/positions/saga'
import { allowHooksPreviewSelector } from 'src/positions/selectors'
import { urlFromUriData } from 'src/qrcode/schema'

import {
  QRCodeTypes,
  handleQRCodeDefault,
  handleQRCodeSecureSend,
  handleSecureSend,
  useQRContent,
} from 'src/qrcode/utils'
import { RecipientType } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { Actions, QrCode } from 'src/send/actions'
import { QRCodeDataType } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAccount3,
  mockE164Number,
  mockE164Number3,
  mockE164NumberToAddress,
  mockName,
  mockQrCodeData,
  mockRecipientInfo,
  mockTransactionData,
} from 'test/values'

jest.mock('src/positions/saga')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useQRContent', () => {
  const data = {
    address: mockAccount,
    displayName: mockName,
    e164PhoneNumber: mockE164Number,
  }
  const MockComponent = (props: {
    dataType: QRCodeDataType
    data: {
      address: string
      displayName: string | undefined
      e164PhoneNumber: string | undefined
    }
  }) => {
    const qrCodeString = useQRContent(props.dataType, props.data)
    return <View testID="qrCodeString">{qrCodeString}</View>
  }
  it('returns a url when dataType is ValoraDeepLink', () => {
    const { getByTestId } = render(
      <MockComponent dataType={QRCodeDataType.ValoraDeepLink} data={data} />
    )
    expect(getByTestId('qrCodeString').children[0]).toEqual(urlFromUriData(data))
  })

  it('returns an address when dataType is address', () => {
    const { getByTestId } = render(<MockComponent dataType={QRCodeDataType.Address} data={data} />)
    expect(getByTestId('qrCodeString').children[0]).toEqual(data.address)
  })
})

describe('handleQRCodeDefault', () => {
  it('handles hooks enable preview links', async () => {
    const link = 'celo://wallet/hooks/enablePreview?hooksApiUrl=https://192.168.0.42:18000'
    const data: QrCode = { type: QRCodeTypes.QR_CODE, data: link }

    await expectSaga(handleQRCodeDefault, data)
      .provide([[select(allowHooksPreviewSelector), true]])
      .run()

    expect(handleEnableHooksPreviewDeepLink).toHaveBeenCalledWith(
      link,
      HooksEnablePreviewOrigin.Scan
    )
  })
  it('navigates to the send amount screen with a valid QR code', async () => {
    const data: QrCode = { type: QRCodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }

    await expectSaga(handleQRCodeDefault, data)
      .withState(createMockStore({}).getState())
      .provide([[select(recipientInfoSelector), mockRecipientInfo]])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        e164PhoneNumber: mockE164Number,
        contactId: 'contactId',
        displayNumber: '14155550000',
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })
  it('navigates to the send amount screen with a qr code with an empty display name', async () => {
    const data: QrCode = {
      type: QRCodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockAccount3,
        e164PhoneNumber: mockE164Number3,
      }),
    }

    await expectSaga(handleQRCodeDefault, data)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount3.toLowerCase(),
        e164PhoneNumber: mockE164Number3,
        contactId: undefined,
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })
  it('navigates to the send amount screen with a qr code with an empty phone number', async () => {
    const data: QrCode = {
      type: QRCodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockAccount3,
        displayName: mockQrCodeData.displayName,
      }),
    }

    await expectSaga(handleQRCodeDefault, data)
      .withState(createMockStore({}).getState())
      .provide([
        [select(e164NumberToAddressSelector), {}],
        [select(recipientInfoSelector), mockRecipientInfo],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount3.toLowerCase(),
        name: mockName,
        displayNumber: undefined,
        e164PhoneNumber: undefined,
        contactId: undefined,
        thumbnailPath: undefined,
        recipientType: RecipientType.Address,
      },
      forceTokenId: false,
    })
  })
})

describe('handleQRCodeSecureSend', () => {
  it('handles a valid address and navigates to send confirmation', async () => {
    const data: QrCode = { type: QRCodeTypes.QR_CODE, data: mockAccount }
    await expectSaga(handleQRCodeSecureSend, data, mockTransactionData, mockAccount2)
      .provide([
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [
          call(
            handleSecureSend,
            mockAccount.toLowerCase(),
            mockE164NumberToAddress,
            mockTransactionData,
            mockAccount2
          ),
          true,
        ],
      ])
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      transactionData: mockTransactionData,
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
    })
  })
  it('handles an invalid address', async () => {
    const data: QrCode = { type: QRCodeTypes.QR_CODE, data: 'invalid-address' }
    await expectSaga(handleQRCodeSecureSend, data, mockTransactionData, mockAccount2)
      .provide([[select(e164NumberToAddressSelector), mockE164NumberToAddress]])
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .run()
    expect(navigate).not.toHaveBeenCalled()
  })
})

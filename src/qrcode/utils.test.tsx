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
import { QrCode } from 'src/send/actions'
import { QRCodeDataType } from 'src/statsig/types'
import {
  mockAccount,
  mockAccount2,
  mockE164Number,
  mockE164NumberToAddress,
  mockName,
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

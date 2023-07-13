import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { View } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import { handleEnableHooksPreviewDeepLink } from 'src/positions/saga'
import { allowHooksPreviewSelector } from 'src/positions/selectors'
import { urlFromUriData } from 'src/qrcode/schema'
import { BarcodeTypes, handleBarcode, useQRContent } from 'src/qrcode/utils'
import { QrCode } from 'src/send/actions'
import { QRCodeDataType } from 'src/statsig/types'
import {
  mockAccount,
  mockE164Number,
  mockE164NumberToAddress,
  mockName,
  mockRecipientInfo,
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

describe('handleBarcode', () => {
  it('handles hooks enable preview links', async () => {
    const link = 'celo://wallet/hooks/enablePreview?hooksApiUrl=https://192.168.0.42:18000'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: link }

    await expectSaga(handleBarcode, data, mockE164NumberToAddress, mockRecipientInfo)
      .provide([[select(allowHooksPreviewSelector), true]])
      .run()

    expect(handleEnableHooksPreviewDeepLink).toHaveBeenCalledWith(
      link,
      HooksEnablePreviewOrigin.Scan
    )
  })
})

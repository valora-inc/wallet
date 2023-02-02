import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { View } from 'react-native'
import { urlFromUriData } from 'src/qrcode/schema'
import { useQRContent } from 'src/qrcode/utils'
import { mockAccount, mockE164Number, mockName } from 'test/values'
import { QRCodeDataType } from 'src/statsig/types'

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

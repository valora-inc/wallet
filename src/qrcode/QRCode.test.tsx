import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import QRCode from 'src/qrcode/QRCode'
import { createMockStore } from 'test/utils'
import { mockAccount, mockName } from 'test/values'
import { QRCodeDataType } from 'src/statsig/types'

describe('QRCode', () => {
  const store = createMockStore({
    account: { name: mockName },
    web3: {
      account: mockAccount,
    },
  })
  it.each(Object.values(QRCodeDataType))('renders correctly', (dataType) => {
    const tree = render(
      <Provider store={store}>
        <QRCode dataType={dataType} qrSvgRef={{ current: null }} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

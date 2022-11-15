import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import { Fee, TokenTransactionTypeV2 } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, RecursivePartial } from 'test/utils'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'
const MOCK_ADDRESS = '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075'.toLowerCase()

describe('NftFeedItem', () => {
  function renderScreen({
    storeOverrides = {},
    type = TokenTransactionTypeV2.NftReceived,
    fees = [],
  }: {
    type?: TokenTransactionTypeV2
    fees?: Fee[]
    storeOverrides?: RecursivePartial<RootState>
  }) {
    const store = createMockStore({
      web3: {
        account: MOCK_ADDRESS,
      },
    })

    const tree = render(
      <Provider store={store}>
        <NftFeedItem
          transaction={{
            __typename: 'NftTransferV2',
            type,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            fees,
          }}
        />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('opens NFT Viewer correctly when NFT transaction item is clicked', () => {
    const tree = renderScreen({})

    fireEvent.press(tree.getByTestId('NftFeedItem'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${MOCK_ADDRESS}&hide-header=true`,
    })
  })
})

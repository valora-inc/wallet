import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import NftFeedItem from 'src/transactions/feed/NftFeedItem'
import { Fee, NetworkId, TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { RecursivePartial, createMockStore } from 'test/utils'
import { mockAccount, mockNftAllFields } from 'test/values'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'

jest.mock('src/statsig')

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

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
        account: mockAccount,
      },
    })

    const tree = render(
      <Provider store={store}>
        <NftFeedItem
          transaction={{
            __typename: 'NftTransferV3',
            networkId: NetworkId['celo-alfajores'],
            type,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            fees,
            nfts: [mockNftAllFields],
            status: TransactionStatus.Complete,
          }}
        />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('shows NFT icon with correct source when enabled from statsig', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByTestId } = renderScreen({})
    expect(getByTestId('NftFeedItem/NftIcon')).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftAllFields.media[0].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )
  })

  it('shows default icon when disabled from statsig', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { getByText, getByTestId } = renderScreen({})
    expect(getByText('receivedNft')).toBeTruthy()
    expect(getByTestId('NftReceivedIcon')).toBeTruthy()
  })

  it('opens NFT Info Carousel correctly when NFT transaction item is clicked', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const tree = renderScreen({})

    fireEvent.press(tree.getByTestId('NftFeedItem'))

    expect(navigate).toHaveBeenCalledWith(Screens.NftsInfoCarousel, {
      nfts: [mockNftAllFields],
      networkId: NetworkId['celo-alfajores'],
    })
  })

  it('opens NFT Viewer correctly when NFT transaction item is clicked and viewer is disabled in Statsig', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const tree = renderScreen({})

    fireEvent.press(tree.getByTestId('NftFeedItem'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${
        networkConfig.nftsValoraAppUrl
      }?address=${mockAccount.toLowerCase()}&hide-header=true`,
    })
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import NFTsTransactionItem from 'src/transactions/feed/NFTsTransactionItem'
import { Fee, TokenTransactionTypeV2 } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, RecursivePartial } from 'test/utils'

const MOCK_TX_HASH = '0x006b866d20452a24d1d90c7514422188cc7c5d873e2f1ed661ec3f810ad5331c'
const MOCK_ADDRESS = '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075'.toLowerCase()

const MOCK_TRANSFERS = [
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x3028eb83c2ea970df13d1a4377b1d5499a534dfe',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x8fcb77e69a972749a21628e1c6b80098fc4456c2',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0xd61546d9ded235b180bd7bf9ac58b98d3ef99488',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x9dbd4cec1c3f22a351a2e25aa57dae1cf3db3919',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x4a91bb962c337eb2eee20d7d4bf6dcb8f808f31a',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x4a91bb962c337eb2eee20d7d4bf6dcb8f808f31a',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x4a91bb962c337eb2eee20d7d4bf6dcb8f808f31a',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0xeeed8374328c7c412b82a5d768fd281ca00db190',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: MOCK_ADDRESS,
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: MOCK_ADDRESS,
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0xc3e1e1358bda2a0c0e610b33871e6ebbf1523a58',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x4a91bb962c337eb2eee20d7d4bf6dcb8f808f31a',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x5e3d098ebb614dbbc3f2f47f10a04033fe2f0284',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0xef0f63d3a65bf9da628417e41f282dbcd5e9e277',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x18c6676f3f447817708ef4811e75ae52fdf81b90',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x2c80e7c23859962ab7b36b82c4f11f5d023b0f97',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x69a00362556e65aa761671edb6079297985dba9e',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x0000000000000000000000000000000000000000',
    toAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
  {
    fromAddressHash: '0x26aee0de70c180f33190cd4f34c02c47c56b2665',
    toAddressHash: '0x009f406268166bfe0e51f4c894169495875a9190',
    fromAccountHash: null,
    toAccountHash: null,
    token: null,
    tokenAddress: '0xb814fe80d5f1cb29f177ac27ecd29d1f4f378c99',
    value: null,
    tokenType: 'ERC-721',
  },
]

describe('NFTsTransactionItem', () => {
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
        <NFTsTransactionItem
          transaction={{
            __typename: 'NFTsTransactionV2',
            type,
            transactionHash: MOCK_TX_HASH,
            timestamp: 1234,
            block: '2345',
            transfers: MOCK_TRANSFERS,
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

    fireEvent.press(tree.getByTestId('ClickNFTsTransactionItem'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${MOCK_ADDRESS}&hide-header=true`,
    })
  })
})

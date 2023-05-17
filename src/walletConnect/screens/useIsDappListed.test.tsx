import { renderHook } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { createMockStore } from 'test/utils'

const renderHookWithProvider = (dappUrl: string) => {
  const store = createMockStore({
    dapps: {
      dappsList: [
        {
          categoryId: 'finance-tools',
          dappUrl: 'https://celotracker.com?address=0x047154ac4d7e01b1dc9ddeea9e8996b57895a747',
          description: 'Manage your Celo Portfolio from DeFi to NFTs',
          iconUrl:
            'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/celotracker.png',
          id: 'celotracker',
          isFeatured: false,
          name: 'Celo Tracker',
        },
        {
          name: 'Moola',
          id: '2',
          categoryId: '2',
          description: 'Lend and borrow tokens!',
          iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png',
          dappUrl: 'celo://wallet/moolaScreen',
          isFeatured: false,
        },
      ],
    },
  })

  return renderHook(() => useIsDappListed(dappUrl), {
    wrapper: (component) => (
      <Provider store={store}>{component?.children ? component.children : component}</Provider>
    ),
  })
}

describe('useIsDappListed', () => {
  it('should return true if dapp is listed in the dapps list', () => {
    const { result } = renderHookWithProvider('https://celotracker.com/some-resource')

    expect(result.current).toBe(true)
  })

  it('should return false if dapp is not listed in the dapps list', () => {
    const { result } = renderHookWithProvider('https://random-dapp.com/')

    expect(result.current).toBe(false)
  })
})

import { renderHook } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DEEP_LINK_URL_SCHEME } from 'src/config'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { createMockStore } from 'test/utils'

const renderHookWithProvider = (dappUrl: string) => {
  const store = createMockStore({
    dapps: {
      dappsList: [
        {
          categories: ['finance-tools'],
          dappUrl: 'https://celotracker.com?address=0x047154ac4d7e01b1dc9ddeea9e8996b57895a747',
          description: 'Manage your Celo Portfolio from DeFi to NFTs',
          iconUrl: 'https://raw.githubusercontent.com/dapp-list/main/assets/celotracker.png',
          id: 'celotracker',
          name: 'Celo Tracker',
        },
        {
          name: 'Moola',
          id: '2',
          categories: ['2'],
          description: 'Lend and borrow tokens!',
          iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/moola.png',
          dappUrl: `${DEEP_LINK_URL_SCHEME}://wallet/moolaScreen`,
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

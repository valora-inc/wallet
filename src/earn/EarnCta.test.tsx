import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnCta from 'src/earn/EarnCta'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [networkConfig.arbUsdcTokenId]: {
        tokenId: networkConfig.arbUsdcTokenId,
        symbol: 'USDC',
        priceUsd: '1',
        priceFetchedAt: Date.now(),
        networkId: NetworkId['arbitrum-sepolia'],
      },
    },
  },
})

describe('EarnCta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <EarnCta />
      </Provider>
    )

    expect(getByText('earnFlow.cta.title')).toBeTruthy()
    expect(getByText('earnFlow.cta.subtitle')).toBeTruthy()
    expect(getByText('earnFlow.cta.subtitle')).toBeTruthy()

    fireEvent.press(getByTestId('EarnCta'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_cta_press)
  })
})

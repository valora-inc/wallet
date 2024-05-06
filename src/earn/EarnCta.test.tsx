import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnCta from 'src/earn/EarnCta'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

jest.mock('src/earn/poolInfo')

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [networkConfig.arbUsdcTokenId]: {
        tokenId: networkConfig.arbUsdcTokenId,
        address: '0x12345',
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
    jest.mocked(fetchAavePoolInfo).mockResolvedValue({ apy: 0.33 })
  })

  it('should render correctly', async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <EarnCta />
      </Provider>
    )

    expect(getByText('earnStablecoin.title')).toBeTruthy()
    expect(getByText('earnStablecoin.subtitle')).toBeTruthy()
    await waitFor(() => expect(getByTestId('EarnCta/Description')).toBeTruthy())
    expect(getByTestId('EarnCta/Description')).toHaveTextContent(
      'earnStablecoin.description10.00 USDC₱4.39'
    )
    expect(fetchAavePoolInfo).toHaveBeenCalledWith('0x12345')

    fireEvent.press(getByTestId('EarnCta'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_cta_press)
  })
})

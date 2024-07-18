import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnActivePools from 'src/earn/EarnActivePools'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

const mockPoolTokenId = networkConfig.aaveArbUsdcTokenId

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockPoolTokenId]: {
        ...mockTokenBalances[mockArbUsdcTokenId],
        tokenId: mockPoolTokenId,
        balance: '10',
        priceUsd: '0.999',
      },
    },
  },
})

describe('EarnActivePools', () => {
  it('renders pools count and total supplied', () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EarnActivePools />
      </Provider>
    )

    expect(getByTestId('EarnActivePools')).toBeTruthy()
    expect(getByTestId('EarnActivePools/PoolsSupplied')).toContainElement(getByText('1'))
    expect(getByTestId('EarnActivePools/TotalSupplied')).toContainElement(getByText('₱13.29'))
  })

  it('explore pools navigates to correct tab on earn home page', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePools />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.activePools.explore'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_active_pools_cta_press, {
      action: 'exploreOpenPools',
    })
    // TODO(ACT-1260): add navigate assertion
  })

  it('my pools navigates to correct tab on earn home page', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePools />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.activePools.myPools'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_active_pools_cta_press, {
      action: 'myPools',
    })
    // TODO(ACT-1260): add navigate assertion
  })
})

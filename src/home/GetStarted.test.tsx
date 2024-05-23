import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import GetStarted from 'src/home/GetStarted'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/earn/poolInfo', () => ({
  fetchAavePoolInfo: jest.fn().mockResolvedValue({ apy: 0.0135 }),
}))

describe('GetStarted', () => {
  it('should display the correct text', async () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [networkConfig.arbUsdcTokenId]: {
                ...mockTokenBalances[mockArbUsdcTokenId],
                tokenId: networkConfig.arbUsdcTokenId,
              },
            },
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    expect(getByText('getStarted')).toBeTruthy()
    expect(getByText('getStartedHome.titleV1_86')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.subtitle, {"symbol":"USDC"}')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokens')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokensBody')).toBeTruthy()
    await waitFor(() =>
      expect(
        getByText('earnFlow.ctaV1_86.description, {"apy":"1.35","symbol":"USDC"}')
      ).toBeTruthy()
    )
  })

  it('should trigger impression analytics event', () => {
    render(
      <Provider
        store={createMockStore({
          app: {
            superchargeApy: 12,
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_impression
    )
  })

  it('should trigger button tap analytics event', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: {
            superchargeApy: 12,
          },
        })}
      >
        <GetStarted />
      </Provider>
    )

    fireEvent.press(getByTestId('GetStarted/Touchable'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_selected
    )
  })
})

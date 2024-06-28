import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { fetchPoolInfo } from 'src/earn/slice'
import GetStarted from 'src/home/GetStarted'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

describe('GetStarted', () => {
  it('should display the correct text', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [networkConfig.arbUsdcTokenId]: {
            ...mockTokenBalances[mockArbUsdcTokenId],
            tokenId: networkConfig.arbUsdcTokenId,
          },
        },
      },
      earn: {
        poolInfo: {
          apy: 0.0135,
        },
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <GetStarted />
      </Provider>
    )

    expect(getByText('getStarted')).toBeTruthy()
    expect(getByText('getStartedHome.titleV1_86')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.subtitle, {"symbol":"USDC"}')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"1.35","symbol":"USDC"}')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokens')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokensBody')).toBeTruthy()
    expect(store.getActions()).toEqual([fetchPoolInfo()])
  })

  it('should display fallback if apy is not available', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [networkConfig.arbUsdcTokenId]: {
            ...mockTokenBalances[mockArbUsdcTokenId],
            tokenId: networkConfig.arbUsdcTokenId,
          },
        },
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <GetStarted />
      </Provider>
    )

    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    expect(store.getActions()).toEqual([fetchPoolInfo()])
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

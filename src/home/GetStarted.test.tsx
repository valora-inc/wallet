import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { fetchPoolInfo } from 'src/earn/slice'
import GetStarted from 'src/home/GetStarted'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

describe('GetStarted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('should display the correct text when multiple pools gate is enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <GetStarted />
      </Provider>
    )

    expect(getByText('getStarted')).toBeTruthy()
    expect(getByText('getStartedHome.titleV1_86')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.title')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.description')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokens')).toBeTruthy()
    expect(getByText('getStartedHome.exploreTokensBody')).toBeTruthy()
    expect(store.getActions()).toEqual([])
  })

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
      <Provider store={createMockStore({})}>
        <GetStarted />
      </Provider>
    )

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_impression
    )
  })

  it('should trigger button tap analytics event', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <GetStarted />
      </Provider>
    )

    fireEvent.press(getByTestId('GetStarted/Touchable'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_add_get_started_selected
    )
  })
})

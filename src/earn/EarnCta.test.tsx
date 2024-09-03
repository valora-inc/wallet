import { act, fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnCta from 'src/earn/EarnCta'
import { fetchPoolInfo } from 'src/earn/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

const createStore = (apy?: number) =>
  createMockStore({
    tokens: {
      tokenBalances: mockTokenBalances,
    },
    earn: {
      poolInfo: apy ? { apy } : undefined,
    },
  })

describe('EarnCta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with APY', () => {
    const store = createStore(0.02345)
    const { getByText } = render(
      <Provider store={store}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    expect(getByText('earnFlow.ctaV1_86.title')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.subtitle, {"symbol":"USDC"}')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"2.35","symbol":"USDC"}')).toBeTruthy()
    expect(store.getActions()).toEqual([fetchPoolInfo()])
  })

  it('renders description correctly when apy is not available', async () => {
    const store = createStore()
    const { getByText } = render(
      <Provider store={store}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    expect(store.getActions()).toEqual([fetchPoolInfo()])
  })

  it('navigates to EarnInfoScreen when pressed', async () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    await act(() => fireEvent.press(getByTestId('EarnCta')))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_cta_press, {
      depositTokenId: mockArbUsdcTokenId,
      providerId: 'aave',
      networkId: NetworkId['arbitrum-sepolia'],
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnInfoScreen)
  })
})

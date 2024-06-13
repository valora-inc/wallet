import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnCta from 'src/earn/EarnCta'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

const createStore = (balance: string = '0') =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [mockArbUsdcTokenId]: {
          ...mockTokenBalances[mockArbUsdcTokenId],
          balance,
        },
      },
    },
  })

jest.mock('src/earn/poolInfo')

describe('EarnCta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(fetchAavePoolInfo).mockResolvedValue({ apy: 0.02345 })
  })

  it('renders correctly with APY', async () => {
    const { getByText } = render(
      <Provider store={createStore()}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    expect(getByText('earnFlow.ctaV1_86.title')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.subtitle, {"symbol":"USDC"}')).toBeTruthy()
    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    await waitFor(() =>
      expect(
        getByText('earnFlow.ctaV1_86.description, {"apy":"2.35","symbol":"USDC"}')
      ).toBeTruthy()
    )
  })

  it('renders description correctly when apy is not available', async () => {
    jest.mocked(fetchAavePoolInfo).mockRejectedValue(new Error('error'))
    const { getByText } = render(
      <Provider store={createStore()}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    await waitFor(() =>
      expect(getByText('earnFlow.ctaV1_86.description, {"apy":"--","symbol":"USDC"}')).toBeTruthy()
    )
  })

  it('navigates to EarnInfoScreen when pressed', async () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <EarnCta depositTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    await act(() => fireEvent.press(getByTestId('EarnCta')))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_cta_press, {
      depositTokenId: mockArbUsdcTokenId,
      providerId: 'aave-v3',
      networkId: NetworkId['arbitrum-sepolia'],
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnInfoScreen, { tokenId: mockArbUsdcTokenId })
  })
})

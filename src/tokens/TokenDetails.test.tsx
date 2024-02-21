import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Price } from 'src/priceHistory/slice'
import { getFeatureGate } from 'src/statsig'
import TokenDetailsScreen from 'src/tokens/TokenDetails'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  exchangePriceHistory,
  mockCeloTokenId,
  mockPoofTokenId,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(() => {
    return {
      showCico: ['celo-alfajores', 'ethereum-sepolia'],
      showSend: ['celo-alfajores', 'ethereum-sepolia'],
      showSwap: ['celo-alfajores', 'ethereum-sepolia'],
    }
  }),
  getFeatureGate: jest.fn().mockReturnValue(true),
}))

describe('TokenDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders title, balance and token balance item', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: mockTokenBalances[mockPoofTokenId],
        },
      },
    })

    const { getByTestId, getByText, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/TitleImage')).toBeTruthy()
    expect(getByTestId('TokenDetails/Title')).toHaveTextContent('Poof Governance Token')
    expect(getByTestId('TokenDetails/AssetValue')).toHaveTextContent('₱0.13')
    expect(getByText('tokenDetails.yourBalance')).toBeTruthy()
    expect(getByTestId('TokenBalanceItem')).toBeTruthy()
    expect(queryByTestId('TokenDetails/LearnMore')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Chart')).toBeFalsy()
  })

  it('renders learn more if token has infoUrl', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: {
            ...mockTokenBalances[mockPoofTokenId],
            infoUrl: 'https://poofToken',
          },
        },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/LearnMore')).toBeTruthy()
    fireEvent.press(getByTestId('TokenDetails/LearnMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: 'https://poofToken' })
  })

  it('renders price unavailable if token price is not present', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: {
            ...mockTokenBalances[mockPoofTokenId],
            priceUsd: undefined,
          },
        },
      },
    })

    const { queryByTestId, getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(queryByTestId('TokenDetails/PriceDelta')).toBeFalsy()
    expect(getByText('tokenDetails.priceUnavailable')).toBeTruthy()
    expect(getByTestId('TokenDetails/AssetValue')).toHaveTextContent('₱ --')
  })

  it('renders no price info if historical price info is not available', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: mockTokenBalances[mockPoofTokenId],
        },
      },
    })

    const { queryByTestId, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(queryByTestId('TokenDetails/PriceDelta')).toBeFalsy()
    expect(queryByText('tokenDetails.priceUnavailable')).toBeFalsy()
  })

  it('renders no price info if historical price info is out of date', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: {
            ...mockTokenBalances[mockPoofTokenId],
            historicalPricesUsd: {
              lastDay: {
                at: Date.now() - 2 * ONE_DAY_IN_MILLIS,
                price: 1,
              },
            },
          },
        },
      },
    })

    const { queryByTestId, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(queryByTestId('TokenDetails/PriceDelta')).toBeFalsy()
    expect(queryByText('tokenDetails.priceUnavailable')).toBeFalsy()
  })

  it('renders price delta if historical price is available and one day old', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: {
            ...mockTokenBalances[mockPoofTokenId],
            historicalPricesUsd: {
              lastDay: {
                at: Date.now() - ONE_DAY_IN_MILLIS,
                price: 1,
              },
            },
          },
        },
      },
    })

    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/PriceDelta')).toBeTruthy()
    expect(queryByText('tokenDetails.priceUnavailable')).toBeFalsy()
  })

  it('renders chart if token is native (celo) using firebase', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false) // Use old prices from firebase
    const store = createMockStore({
      exchange: {
        history: exchangePriceHistory,
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/Chart')).toBeTruthy()
  })

  it('renders chart loader using blockchain API', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true) // Use new prices from blockchain API
    const store = createMockStore({
      priceHistory: {
        [mockCeloTokenId]: {
          status: 'loading',
        },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(getByTestId(`PriceHistoryChart/Loader`)).toBeTruthy()
  })

  it('renders chart using blockchain API', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true) // Use new prices from blockchain API
    const store = createMockStore({
      priceHistory: {
        [mockCeloTokenId]: {
          status: 'success',
          prices: [
            {
              priceFetchedAt: 1700378258000,
              priceUsd: '0.97',
            },
            {
              priceFetchedAt: 1701659858000,
              priceUsd: '1.2',
            },
            {
              priceFetchedAt: 1702941458000,
              priceUsd: '1.4',
            },
          ] as Price[],
        },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(getByTestId(`TokenDetails/Chart/${mockCeloTokenId}`)).toBeTruthy()
  })

  it('does not render chart if no prices are found and error status', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true) // Use new prices from blockchain API
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: mockTokenBalances[mockCeloTokenId],
        },
      },
      priceHistory: {
        [mockCeloTokenId]: {
          status: 'error',
          prices: [],
        },
      },
    })

    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )
    expect(queryByTestId(`TokenDetails/Chart/${mockCeloTokenId}`)).toBeFalsy()
    expect(queryByTestId(`PriceHistoryChart/Loader`)).toBeFalsy()
  })

  it('renders send and swap action only if token has balance, and not a CICO token', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: mockTokenBalances[mockPoofTokenId],
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/Action/Send')).toBeTruthy()
    expect(getByTestId('TokenDetails/Action/Swap')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Add')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/Withdraw')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/More')).toBeFalsy()
  })

  it('renders send and swap action only if token has balance, is swappable and not a CICO token', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: { ...mockTokenBalances[mockPoofTokenId], isSwappable: true },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockPoofTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/Action/Send')).toBeTruthy()
    expect(getByTestId('TokenDetails/Action/Swap')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Add')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/Withdraw')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/More')).toBeFalsy()
  })

  it('renders send, swap and more if token has balance, is swappable and a CICO token', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '10',
            isSwappable: true,
          },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/Action/Send')).toBeTruthy()
    expect(getByTestId('TokenDetails/Action/Swap')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Add')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/Withdraw')).toBeFalsy()
    expect(getByTestId('TokenDetails/Action/More')).toBeTruthy()
  })

  it('renders add only for CICO token with 0 balance', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            isSwappable: true,
          },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(queryByTestId('TokenDetails/Action/Send')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/Swap')).toBeFalsy()
    expect(getByTestId('TokenDetails/Action/Add')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Withdraw')).toBeFalsy()
    expect(queryByTestId('TokenDetails/Action/More')).toBeFalsy()
  })

  it('hides swap action and shows more action if token is swappable, has balance and CICO token but swapfeature gate is false', () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '10',
            isSwappable: true,
          },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: false,
      },
    })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    expect(getByTestId('TokenDetails/Action/Send')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Swap')).toBeFalsy()
    expect(getByTestId('TokenDetails/Action/Add')).toBeTruthy()
    expect(getByTestId('TokenDetails/Action/More')).toBeTruthy()
    expect(queryByTestId('TokenDetails/Action/Withdraw')).toBeFalsy()
  })

  it('actions navigate to appropriate screens', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false) // Use old send flow
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            balance: '10',
            isSwappable: true,
          },
        },
      },
      app: {
        showSwapMenuInDrawerMenu: true,
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TokenDetailsScreen} params={{ tokenId: mockCeloTokenId }} />
      </Provider>
    )

    fireEvent.press(getByTestId('TokenDetails/Action/Send'))
    expect(navigate).toHaveBeenCalledWith(Screens.SendSelectRecipient, {
      defaultTokenIdOverride: mockCeloTokenId,
    })
    fireEvent.press(getByTestId('TokenDetails/Action/Swap'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack, {
      fromTokenId: mockCeloTokenId,
    })
    fireEvent.press(getByTestId('TokenDetails/Action/More'))
    await waitFor(() => expect(getByTestId('TokenDetailsMoreActions')).toBeTruthy())
    fireEvent.press(getByTestId('TokenDetailsMoreActions/Add'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockCeloTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'CELO',
    })
    fireEvent.press(getByTestId('TokenDetailsMoreActions/Withdraw'))
    expect(navigate).toHaveBeenCalledWith(Screens.WithdrawSpend)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(5) // 4 actions + 1 more action
  })
})

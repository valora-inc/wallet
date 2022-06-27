import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  mockTestTokenAddress,
  mockTokenBalances,
  mockTokenBalancesWithHistoricalPrices,
} from 'test/values'

const storeWithoutHistoricalPrices = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      [mockTestTokenAddress]: {
        address: mockTestTokenAddress,
        symbol: 'TT',
        balance: '50',
      },
    },
  },
  app: {
    showPriceChangeIndicatorInBalances: false,
  },
}

const storeWithHistoricalPrices = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalancesWithHistoricalPrices,
      [mockTestTokenAddress]: {
        address: mockTestTokenAddress,
        symbol: 'TT',
        balance: '50',
        usdPrice: '2',
        priceFetchedAt: Date.now(),
        historicalUsdPrices: {
          lastDay: {
            price: '1.3',
            at: Date.now() - ONE_DAY_IN_MILLIS,
          },
        },
      },
    },
  },
  app: {
    showPriceChangeIndicatorInBalances: true,
  },
}

const mockScreenProps = getMockStackScreenProps(Screens.TokenBalances)
const mockWalletAddress = '0x123'

describe('TokenBalancesScreen', () => {
  it('renders correctly when showPriceChangeIndicator ff is off', async () => {
    const store = createMockStore(storeWithoutHistoricalPrices)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('tokenBalance:POOF'))).toBe('5.00')
    expect(getElementText(tree.getByTestId('tokenLocalBalance:POOF'))).toBe('₱0.67')

    expect(getElementText(tree.getByTestId('tokenBalance:TT'))).toBe('50.00')
    expect(tree.queryByTestId('tokenLocalBalance:TT')).toBeFalsy()

    expect(tree.queryByTestId('percentageIndicator:POOF')).toBeFalsy()
    expect(tree.queryByTestId('percentageIndicator:TT')).toBeFalsy()
  })

  it('renders correctly when showPriceChangeIndicator ff is on', async () => {
    const store = createMockStore(storeWithHistoricalPrices)

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('tokenBalance:POOF'))).toBe('5.00')
    expect(getElementText(tree.getByTestId('tokenLocalBalance:POOF'))).toBe('₱0.67')

    expect(getElementText(tree.getByTestId('percentageIndicator:POOF'))).toBe('33.33%')
    expect(tree.queryByTestId('percentageIndicator:POOF:DownIndicator')).toBeTruthy()

    expect(getElementText(tree.getByTestId('percentageIndicator:TT'))).toBe('53.85%')
    expect(tree.queryByTestId('percentageIndicator:TT:UpIndicator')).toBeTruthy()
  })

  it('renders correctly when visualizeNFTsEnabledInHomeAssetsPage is true', () => {
    const store = createMockStore({
      app: { visualizeNFTsEnabledInHomeAssetsPage: true },
      web3: {
        account: mockWalletAddress,
      },
    })

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree.queryByTestId('NftViewerBanner')).toBeTruthy()

    fireEvent.press(tree.getByTestId('NftViewerBanner'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.view_nft_home_assets)
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${mockWalletAddress}&hide-header=true`,
    })
  })

  it('renders correctly when visualizeNFTsEnabledInHomeAssetsPage is false', () => {
    const store = createMockStore({ app: { visualizeNFTsEnabledInHomeAssetsPage: false } })

    const tree = render(
      <Provider store={store}>
        <TokenBalancesScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree.queryByTestId('NftViewerBanner')).toBeFalsy()
  })
})

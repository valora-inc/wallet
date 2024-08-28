import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnPoolInfoScreen from 'src/earn/EarnPoolInfoScreen'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockArbUsdcTokenId, mockEarnPositions, mockTokenBalances } from 'test/values'

const mockPoolTokenId = networkConfig.aaveArbUsdcTokenId

const store = createMockStore({
  tokens: {
    tokenBalances: { [mockPoolTokenId]: mockTokenBalances[mockArbUsdcTokenId] },
  },
})

describe('EarnPoolInfoScreen', () => {
  it('renders correctly when not deposited in pool', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )

    expect(queryByTestId('DepositAndEarningsCard')).toBeFalsy()

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.chainName')
    ).toBeTruthy()

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.protocolName')
    ).toBeTruthy()

    expect(
      within(getByTestId('YieldCard')).getAllByText(
        'earnFlow.poolInfoScreen.ratePercent, {"rate":"1.92"}'
      )
    ).toBeTruthy()

    expect(within(getByTestId('TvlCard')).getByText('earnFlow.poolInfoScreen.tvl')).toBeTruthy()
    expect(within(getByTestId('TvlCard')).getByText('₱2,170,560.00')).toBeTruthy()

    expect(
      within(getByTestId('AgeCard')).getByText('duration, {"context":"month","count":5}')
    ).toBeTruthy()

    expect(
      within(getByTestId('ActionButtons')).getByText('earnFlow.poolInfoScreen.withdraw')
    ).toBeTruthy()
    expect(
      within(getByTestId('ActionButtons')).getByText('earnFlow.poolInfoScreen.deposit')
    ).toBeTruthy()
  })

  it('renders deposit and earnings card when in pool when deposited in pool', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        earningItems: [
          { amount: '15', label: 'Earnings', tokenId: mockArbUsdcTokenId },
          { amount: '1', label: 'Reward', tokenId: mockArbUsdcTokenId },
        ],
      },
    }

    const { getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockPool,
                })}
              />
            )
          }}
        />
      </Provider>
    )

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.totalDepositAndEarnings'
      )
    ).toBeTruthy()

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"133.00"}'
      )
    ).toBeTruthy()

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"133.00","cryptoAmount":"133.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()

    expect(getAllByTestId('EarningItemLineItem')).toHaveLength(2)
    expect(
      within(getAllByTestId('EarningItemLineItem')[0]).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"19.95","cryptoAmount":"15.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
    expect(
      within(getAllByTestId('EarningItemLineItem')[1]).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"1.33","cryptoAmount":"1.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
  })

  it('calls navigateToURI when View Pool on Provider Touchable is tapped', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )
    fireEvent.press(
      getByText('earnFlow.poolInfoScreen.learnMoreOnProvider, {"providerName":"Aave"}')
    )
    expect(navigateToURI).toHaveBeenCalledWith('https://app.aave.com/?marketName=proto_arbitrum_v3')
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_view_pool, {
      appId: 'aave',
      positionId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
    })
  })
})

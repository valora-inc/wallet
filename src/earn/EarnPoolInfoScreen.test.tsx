import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnPoolInfoScreen from 'src/earn/EarnPoolInfoScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockCusdTokenId,
  mockEarnPositions,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig', () => ({
  getMultichainFeatures: jest.fn(),
  getFeatureGate: jest.fn(),
}))

const mockPoolTokenId = mockEarnPositions[0].dataProps.depositTokenId

function getStore({
  balance = '0',
  includeSameChainToken = false,
  includeOtherChainToken = false,
}: {
  balance?: string
  includeSameChainToken?: boolean
  includeOtherChainToken?: boolean
}) {
  const sameChainToken = includeSameChainToken
    ? { [mockArbEthTokenId]: { ...mockTokenBalances[mockArbEthTokenId], balance: '1' } }
    : {}
  const otherChainToken = includeOtherChainToken
    ? { [mockCusdTokenId]: { ...mockTokenBalances[mockCusdTokenId], balance: '10' } }
    : {}
  return createMockStore({
    tokens: {
      tokenBalances: {
        ...sameChainToken,
        ...otherChainToken,
        [mockPoolTokenId]: {
          ...mockTokenBalances[mockArbUsdcTokenId],
          balance,
          isCashInEligible: true,
        },
      },
    },
    app: { showSwapMenuInDrawerMenu: true },
  })
}

const renderEarnPoolInfoScreen = (pool: EarnPosition) =>
  render(
    <Provider store={getStore({})}>
      <MockedNavigator component={EarnPoolInfoScreen} params={{ pool }} />
    </Provider>
  )

describe('EarnPoolInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getMultichainFeatures).mockReturnValue({
      showCico: [NetworkId['arbitrum-sepolia']],
      showSwap: [NetworkId['celo-alfajores'], NetworkId['arbitrum-sepolia']],
    })
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)
    jest.useFakeTimers({
      now: new Date('2024-08-15T00:00:00.000Z'),
    })
  })

  it('renders correctly when not deposited in pool', () => {
    const { getByTestId, queryByTestId } = renderEarnPoolInfoScreen(mockEarnPositions[0])

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
      within(getByTestId('ActionButtons')).queryByText('earnFlow.poolInfoScreen.withdraw')
    ).toBeFalsy()
    expect(
      within(getByTestId('ActionButtons')).getByText('earnFlow.poolInfoScreen.deposit')
    ).toBeTruthy()
  })

  it('renders deposit and earnings card when user has deposited in pool', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        earningItems: [
          { amount: '15', label: 'Earnings', tokenId: mockArbUsdcTokenId },
          {
            amount: '1',
            label: 'Reward',
            tokenId: mockArbUsdcTokenId,
            includedInPoolBalance: false,
          },
        ],
      },
    }

    const { getByTestId, getAllByTestId } = renderEarnPoolInfoScreen(mockPool)

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.totalDepositAndEarnings'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        ' earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"154.28"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"133.00","cryptoAmount":"100.00","cryptoSymbol":"USDC"}'
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

  it('renders correctly when compounded interest cannot be separated', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        cantSeparateCompoundedInterest: true,
      },
    }

    const { getByTestId } = renderEarnPoolInfoScreen(mockPool)

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.depositAndEarnings'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        ' earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"133.00"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"133.00","cryptoAmount":"100.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
  })

  it('renders correctly when includedInPoolBalance is true for an earning item', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        earningItems: [
          { amount: '15', label: 'Earnings', tokenId: mockArbUsdcTokenId },
          {
            amount: '1',
            label: 'Reward',
            tokenId: mockArbUsdcTokenId,
            includedInPoolBalance: true,
          },
        ],
      },
    }

    const { getByTestId, getAllByTestId } = renderEarnPoolInfoScreen(mockPool)

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.totalDepositAndEarnings'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"152.95"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"132.00","cryptoAmount":"99.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
    expect(getAllByTestId('EarningItemLineItem')).toHaveLength(2)
    expect(
      within(getAllByTestId('EarningItemLineItem')[0]).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"19.95","cryptoAmount":"15.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
  })

  it('navigates to external URI when "View Pool on Provider" is tapped', () => {
    const { getByText } = renderEarnPoolInfoScreen(mockEarnPositions[0])

    fireEvent.press(
      getByText('earnFlow.poolInfoScreen.learnMoreOnProvider, {"providerName":"Aave"}')
    )

    expect(navigateToURI).toHaveBeenCalledWith('https://app.aave.com/?marketName=proto_arbitrum_v3')
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_view_pool, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
  })

  it.each([
    {
      testId: 'DepositInfoBottomSheet',
      infoIconTestId: 'DepositInfoIcon',
      type: 'deposit',
    },
    {
      testId: 'TvlInfoBottomSheet',
      infoIconTestId: 'TvlInfoIcon',
      type: 'tvl',
    },
    {
      testId: 'AgeInfoBottomSheet',
      infoIconTestId: 'AgeInfoIcon',
      type: 'age',
    },
    {
      testId: 'YieldRateInfoBottomSheet',
      infoIconTestId: 'YieldRateInfoIcon',
      type: 'yieldRate',
    },
  ])('opens $testId and track analytics event', ({ testId, infoIconTestId, type }) => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        earningItems: [
          { amount: '15', label: 'Earnings', tokenId: mockArbUsdcTokenId },
          {
            amount: '1',
            label: 'Reward',
            tokenId: mockArbUsdcTokenId,
            includedInPoolBalance: false,
          },
        ],
      },
    }

    const { getByTestId } = renderEarnPoolInfoScreen(mockPool)
    fireEvent.press(getByTestId(infoIconTestId))
    expect(getByTestId(testId)).toBeVisible()
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_info_icon, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      type,
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
  })

  it('navigate to EarnEnterAmount when Deposit button is tapped and depositTokenId has a balance', () => {
    const { getByText } = render(
      <Provider store={getStore({ balance: '1' })}>
        <MockedNavigator component={EarnPoolInfoScreen} params={{ pool: mockEarnPositions[0] }} />
      </Provider>
    )
    fireEvent.press(getByText('earnFlow.poolInfoScreen.deposit'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_deposit, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
      hasDepositToken: true,
      hasTokensOnSameNetwork: false,
      hasTokensOnOtherNetworks: false,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      pool: mockEarnPositions[0],
    })
  })

  it('show bottom sheet correctly when Deposit button is tapped and depositTokenId does not have balance, can same and cross chain swap', () => {
    const { getByText, getByTestId } = render(
      <Provider store={getStore({ includeSameChainToken: true, includeOtherChainToken: true })}>
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
    fireEvent.press(getByText('earnFlow.poolInfoScreen.deposit'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_deposit, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
      hasDepositToken: false,
      hasTokensOnSameNetwork: true,
      hasTokensOnOtherNetworks: true,
    })
    expect(getByTestId('Earn/BeforeDepositBottomSheet')).toBeVisible()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/CrossChainSwap')).toBeTruthy()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/Add')).toBeTruthy()
  })

  it('show bottom sheet correctly when Deposit button is tapped and depositTokenId does not have balance, can cross chain swap', () => {
    const { getByText, getByTestId } = render(
      <Provider store={getStore({ includeOtherChainToken: true })}>
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
    fireEvent.press(getByText('earnFlow.poolInfoScreen.deposit'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_deposit, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
      hasDepositToken: false,
      hasTokensOnSameNetwork: false,
      hasTokensOnOtherNetworks: true,
    })
    expect(getByTestId('Earn/BeforeDepositBottomSheet')).toBeVisible()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/CrossChainSwap')).toBeTruthy()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/Add')).toBeTruthy()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/Transfer')).toBeTruthy()
  })

  it('show bottom sheet correctly when Deposit button is tapped and depositTokenId does not have balance, no tokens', () => {
    const { getByText, getByTestId } = render(
      <Provider store={getStore({})}>
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
    fireEvent.press(getByText('earnFlow.poolInfoScreen.deposit'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_deposit, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
      hasDepositToken: false,
      hasTokensOnSameNetwork: false,
      hasTokensOnOtherNetworks: false,
    })
    expect(getByTestId('Earn/BeforeDepositBottomSheet')).toBeVisible()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/Add')).toBeTruthy()
    expect(getByTestId('Earn/BeforeDepositBottomSheet/Transfer')).toBeTruthy()
  })

  it('navigate to EarnCollectScreen when Withdraw button is tapped', () => {
    const { getByText } = render(
      <Provider store={getStore({})}>
        <MockedNavigator
          component={EarnPoolInfoScreen}
          params={{
            pool: { ...mockEarnPositions[0], balance: '100' },
          }}
        />
      </Provider>
    )
    fireEvent.press(getByText('earnFlow.poolInfoScreen.withdraw'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_withdraw, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      poolAmount: '100',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
    // TODO (ACT-1343): check that navigate is called with correct params
  })
})

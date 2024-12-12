import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnPoolInfoScreen from 'src/earn/poolInfoScreen/EarnPoolInfoScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockPositions,
  mockRewardsPositions,
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
  includeRewardPositions = true,
}: {
  balance?: string
  includeSameChainToken?: boolean
  includeRewardPositions?: boolean
} = {}) {
  const sameChainToken = includeSameChainToken
    ? { [mockArbEthTokenId]: { ...mockTokenBalances[mockArbEthTokenId], balance: '1' } }
    : {}
  return createMockStore({
    tokens: {
      tokenBalances: {
        ...sameChainToken,
        [mockPoolTokenId]: {
          ...mockTokenBalances[mockArbUsdcTokenId],
          balance,
          isCashInEligible: true,
        },
      },
    },
    positions: {
      positions: includeRewardPositions ? [...mockPositions, ...mockRewardsPositions] : [],
    },
    app: { showSwapMenuInDrawerMenu: true },
  })
}

const renderEarnPoolInfoScreen = (pool: EarnPosition) =>
  render(
    <Provider store={getStore()}>
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
    expect(within(getByTestId('TvlCard')).getByText('₱1,808,800.00')).toBeTruthy()
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
        ' earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"180.88"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"146.30","cryptoAmount":"110.00","cryptoSymbol":"USDC"}'
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
        ' earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"159.60"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"146.30","cryptoAmount":"110.00","cryptoSymbol":"USDC"}'
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
        'earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"179.55"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"144.97","cryptoAmount":"109.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
    expect(getAllByTestId('EarningItemLineItem')).toHaveLength(2)
    expect(
      within(getAllByTestId('EarningItemLineItem')[0]).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"19.95","cryptoAmount":"15.00","cryptoSymbol":"USDC"}'
      )
    ).toBeTruthy()
  })

  it('renders correctly when includedInPoolBalance is true for an earning item and earning item is a different token', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        earningItems: [
          { amount: '15', label: 'Earnings', tokenId: mockArbUsdcTokenId },
          {
            amount: '0.001',
            label: 'Reward',
            tokenId: mockArbEthTokenId,
            includedInPoolBalance: true,
          },
        ],
      },
    }

    const { getByTestId, getAllByTestId } = render(
      <Provider store={getStore({ includeSameChainToken: true })}>
        <MockedNavigator component={EarnPoolInfoScreen} params={{ pool: mockPool }} />
      </Provider>
    )

    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.totalDepositAndEarnings'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.titleLocalAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"179.55"}'
      )
    ).toBeTruthy()
    expect(
      within(getByTestId('DepositAndEarningsCard')).getByText(
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"144.31","cryptoAmount":"108.50","cryptoSymbol":"USDC"}'
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
        'earnFlow.poolInfoScreen.lineItemAmountDisplay, {"localCurrencySymbol":"₱","localCurrencyAmount":"2.00","cryptoAmount":"0.001","cryptoSymbol":"ETH"}'
      )
    ).toBeTruthy()
  })

  it('renders safety card when safety is provided', () => {
    const mockPool = {
      ...mockEarnPositions[0],
      balance: '100',
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        safety: {
          level: 'high' as const,
          risks: [
            { isPositive: false, title: 'Risk 1', category: 'Category 1' },
            { isPositive: true, title: 'Risk 2', category: 'Category 2' },
          ],
        },
      },
    }

    const { getByTestId } = renderEarnPoolInfoScreen(mockPool)

    expect(getByTestId('SafetyCard')).toBeTruthy()
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
    {
      testId: 'SafetyScoreInfoBottomSheet',
      infoIconTestId: 'SafetyCardInfoIcon',
      type: 'safetyScore',
    },
  ])('opens $testId and track analytics event', async ({ testId, infoIconTestId, type }) => {
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
        safety: {
          level: 'high' as const,
          risks: [
            { isPositive: false, title: 'Risk 1', category: 'Category 1' },
            { isPositive: true, title: 'Risk 2', category: 'Category 2' },
          ],
        },
      },
    }

    const { getByTestId } = renderEarnPoolInfoScreen(mockPool)
    fireEvent.press(getByTestId(infoIconTestId))
    await waitFor(() => expect(getByTestId(testId)).toBeVisible())
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_info_icon, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      type,
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
  })

  it('Show bottom sheet when Deposit button is tapped and depositTokenId has a balance', () => {
    const { getByText, getByTestId } = render(
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
    expect(getByTestId('Earn/BeforeDepositBottomSheet')).toBeVisible()
  })

  it('Show bottom sheet when Deposit button is tapped and depositTokenId does not have a balance', () => {
    const { getByText, getByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator component={EarnPoolInfoScreen} params={{ pool: mockEarnPositions[0] }} />
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
  })

  it('navigate to EarnConfirmationScreen when Withdraw button is tapped, no rewards and cannot partial withdraw', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gateName: StatsigFeatureGates) => gateName === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByTestId } = render(
      <Provider store={getStore({ includeRewardPositions: false })}>
        <MockedNavigator
          component={EarnPoolInfoScreen}
          params={{
            pool: { ...mockEarnPositions[0], balance: '100' },
          }}
        />
      </Provider>
    )
    fireEvent.press(getByTestId('WithdrawButton'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_tap_withdraw, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      poolAmount: '100',
      networkId: 'arbitrum-sepolia',
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnConfirmationScreen, {
      pool: { ...mockEarnPositions[0], balance: '100' },
      mode: 'exit',
      useMax: true,
    })
  })
  it('open WithdrawBottomSheet when Withdraw button pressed, check that expected options exist', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL ||
          gate === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByTestId } = render(
      <Provider store={getStore()}>
        <MockedNavigator
          component={EarnPoolInfoScreen}
          params={{
            pool: {
              ...mockEarnPositions[0],
              balance: '100',
            },
          }}
        />
      </Provider>
    )
    fireEvent.press(getByTestId('WithdrawButton'))
    expect(getByTestId('Earn/WithdrawBottomSheet')).toBeVisible()
    expect(getByTestId('Earn/ActionCard/withdraw')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/claim-rewards')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/exit')).toBeTruthy()
  })

  it('shows the daily yield rate when it is available', () => {
    const { getByTestId } = renderEarnPoolInfoScreen({
      ...mockEarnPositions[0],
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        dailyYieldRatePercentage: 0.0452483,
      },
    })
    expect(
      within(getByTestId('DailyYieldRateCard')).getAllByText(
        'earnFlow.poolInfoScreen.ratePercent, {"rate":"0.0452"}'
      )
    ).toBeTruthy()
  })
  it.each([0, undefined])('does not show the daily yield rate when it is %s', (dailyYieldRate) => {
    const { queryByTestId } = renderEarnPoolInfoScreen({
      ...mockEarnPositions[0],
      dataProps: {
        ...mockEarnPositions[0].dataProps,
        dailyYieldRatePercentage: dailyYieldRate,
      },
    })
    expect(queryByTestId('DailyYieldRateCard')).toBeFalsy()
  })
})

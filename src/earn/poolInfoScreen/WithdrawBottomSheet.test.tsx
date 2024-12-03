import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import WithdrawBottomSheet from 'src/earn/poolInfoScreen/WithdrawBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import {
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

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockPoolTokenId]: {
        ...mockTokenBalances[mockArbUsdcTokenId],
        isCashInEligible: true,
      },
    },
  },
  positions: {
    positions: [...mockPositions, ...mockRewardsPositions],
  },
})

describe('WithdrawBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('tapping withdraw on WithdrawBottomSheet navigates to enter amount screen', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL)
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{ ...mockEarnPositions[0], balance: '100' }}
          canClaim={true}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/withdraw')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/withdraw'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_select_withdraw_type, {
      type: 'withdraw',
      providerId: mockEarnPositions[0].appId,
      poolId: mockEarnPositions[0].positionId,
      networkId: mockEarnPositions[0].networkId,
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      pool: {
        ...mockEarnPositions[0],
        balance: '100',
      },
      mode: 'withdraw',
    })
  })
  it('tapping claim on WithdrawBottomSheet navigates to confirmation screen', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL ||
          gate === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{ ...mockEarnPositions[0], balance: '100' }}
          canClaim={true}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/claim-rewards')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/claim-rewards'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_select_withdraw_type, {
      type: 'claim-rewards',
      providerId: mockEarnPositions[0].appId,
      poolId: mockEarnPositions[0].positionId,
      networkId: mockEarnPositions[0].networkId,
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnConfirmationScreen, {
      pool: {
        ...mockEarnPositions[0],
        balance: '100',
      },
      mode: 'claim-rewards',
      useMax: true,
    })
  })
  it('tapping exit on WithdrawBottomSheet navigates to enter amount screen', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL)
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{ ...mockEarnPositions[0], balance: '100' }}
          canClaim={true}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/exit')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/exit'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_select_withdraw_type, {
      type: 'exit',
      providerId: mockEarnPositions[0].appId,
      poolId: mockEarnPositions[0].positionId,
      networkId: mockEarnPositions[0].networkId,
      depositTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnConfirmationScreen, {
      pool: {
        ...mockEarnPositions[0],
        balance: '100',
      },
      mode: 'exit',
      useMax: true,
    })
  })
  it('shows correct copy when ClaimType is Earnings', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL ||
          gate === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByText } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{
            ...mockEarnPositions[0],
            dataProps: {
              ...mockEarnPositions[0].dataProps,
              claimType: 'earnings',
            },
            balance: '100',
          }}
          canClaim={true}
        />
      </Provider>
    )
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawDescription')
    ).toBeTruthy()
    expect(getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarnings')).toBeTruthy()
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarningsDescription')
    ).toBeTruthy()
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithEarningsDescription')
    ).toBeTruthy()
  })
  it('shows correct copy when ClaimType is Rewards', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL ||
          gate === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByText } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{
            ...mockEarnPositions[0],
            dataProps: {
              ...mockEarnPositions[0].dataProps,
              claimType: 'rewards',
            },
            balance: '100',
          }}
          canClaim={true}
        />
      </Provider>
    )
    expect(getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewards')).toBeTruthy()
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewardsDescription')
    ).toBeTruthy()
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithRewardsDescription')
    ).toBeTruthy()
  })
  it('shows correct copy when withdrawalIncludesClaim is true', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL ||
          gate === StatsigFeatureGates.SHOW_POSITIONS
      )
    const { getByText } = render(
      <Provider store={store}>
        <WithdrawBottomSheet
          forwardedRef={{ current: null }}
          pool={{
            ...mockEarnPositions[0],
            dataProps: {
              ...mockEarnPositions[0].dataProps,
              claimType: 'earnings',
              withdrawalIncludesClaim: true,
            },
            balance: '100',
          }}
          canClaim={true}
        />
      </Provider>
    )
    expect(getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaim')).toBeTruthy()
    expect(
      getByText('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaimEarningsDescription')
    ).toBeTruthy()
  })
})

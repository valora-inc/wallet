import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openDeepLink } from 'src/app/actions'
import { getFeatureGate } from 'src/statsig/index'
import Colors from 'src/styles/colors'
import { createMockStore } from 'test/utils'
import { mockNftAllFields, mockStoreReminderReady, mockStoreRewardReady } from 'test/values'
import NftReward from './NftReward'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

describe('NftReward', () => {
  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ doNotFake: ['Date'] })
  })

  it('handles the cta correctly', () => {
    jest.useFakeTimers({ now: new Date('3000-11-01T00:00:00.000Z') })

    const store = createMockStore(mockStoreReminderReady)
    store.dispatch = jest.fn()

    const { getByText } = render(
      <Provider store={store}>
        <NftReward />
      </Provider>
    )

    fireEvent.press(getByText('nftCelebration.rewardReminderBottomSheet.cta'))

    expect(store.dispatch).toHaveBeenCalledWith(
      openDeepLink(mockStoreRewardReady.home.nftCelebration.deepLink, true)
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.nft_reward_accept, {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      remainingDays: 30,
    })
  })

  it('renders correct expiration pill when reward is not about to expire', () => {
    jest.useFakeTimers({ now: new Date('2900-12-01T00:00:00.000Z') })

    const { getByTestId } = render(
      <Provider store={createMockStore(mockStoreRewardReady)}>
        <NftReward />
      </Provider>
    )

    const pillLabel = getByTestId('NftReward/PillLabel')
    expect(pillLabel).toHaveTextContent(
      'nftCelebration.rewardBottomSheet.expirationLabel, {"expirationLabelText":"in about 100 years"}'
    )
    expect(StyleSheet.flatten(pillLabel.props.style)).toHaveProperty('color', Colors.black)
    expect(StyleSheet.flatten(getByTestId('NftReward/Pill').props.style)).toHaveProperty(
      'backgroundColor',
      Colors.gray1
    )
  })

  it('renders correct expiration pill when reward is about to expire', () => {
    jest.useFakeTimers({ now: new Date('3000-11-01T00:00:00.000Z') })

    const { getByTestId } = render(
      <Provider store={createMockStore(mockStoreReminderReady)}>
        <NftReward />
      </Provider>
    )

    const pillLabel = getByTestId('NftReward/PillLabel')
    expect(pillLabel).toHaveTextContent(
      'nftCelebration.rewardReminderBottomSheet.expirationLabel, {"expirationLabelText":"in about 1 month"}'
    )
    expect(StyleSheet.flatten(pillLabel.props.style)).toHaveProperty('color', Colors.warningDark)
    expect(StyleSheet.flatten(getByTestId('NftReward/Pill').props.style)).toHaveProperty(
      'backgroundColor',
      Colors.warningLight
    )
  })
})

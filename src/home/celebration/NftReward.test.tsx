import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openDeepLink } from 'src/app/actions'
import { NftCelebrationStatus } from 'src/home/reducers'
import { getFeatureGate } from 'src/statsig/index'
import Colors from 'src/styles/colors'
import { createMockStore } from 'test/utils'
import { mockNftAllFields } from 'test/values'
import NftReward from './NftReward'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

const mockStoreCelebrationReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.celebrationReady,
    },
  },
}

const mockStoreRewardReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardReady,
      expirationDate: '3000-12-01T00:00:00.000Z',
      reminderDate: '3000-01-01T00:00:00.000Z',
      deepLink: 'celo://test',
    },
  },
}

const mockStoreReminderReady = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.reminderReady,
    },
  },
}

const mockStoreRewardDisplayed = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardDisplayed,
    },
  },
}

const mockStoreReminderDisplayed = {
  nfts: {
    nfts: [mockNftAllFields],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.reminderDisplayed,
    },
  },
}

const mockStoreRewardReayWithDifferentNft = {
  nfts: {
    nfts: [{ ...mockNftAllFields, contractAddress: '0xNFT' }],
  },
  home: {
    nftCelebration: {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      status: NftCelebrationStatus.rewardReady,
    },
  },
}

describe('NftReward', () => {
  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly when status is "reward ready"', () => {
    const { getByText } = render(
      <Provider store={createMockStore(mockStoreRewardReady)}>
        <NftReward />
      </Provider>
    )

    expect(getByText('nftCelebration.rewardBottomSheet.title')).toBeTruthy()
    expect(
      getByText('nftCelebration.rewardBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}')
    ).toBeTruthy()
    expect(getByText('nftCelebration.rewardBottomSheet.cta')).toBeTruthy()
  })

  it('renders correctly when status is "reminder ready"', () => {
    const { getByText } = render(
      <Provider store={createMockStore(mockStoreReminderReady)}>
        <NftReward />
      </Provider>
    )

    expect(getByText('nftCelebration.rewardBottomSheet.title')).toBeTruthy()
    expect(
      getByText('nftCelebration.rewardBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}')
    ).toBeTruthy()
    expect(getByText('nftCelebration.rewardBottomSheet.cta')).toBeTruthy()
  })

  it('does not render when status is other than "reward ready" or "reminder ready"', () => {
    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreCelebrationReady)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('does not render when celebrated contract does not match with user nft', () => {
    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreRewardReayWithDifferentNft)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('does not render when feature gate is closed', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreRewardReady)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('does not render if reward is already displayed', () => {
    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreRewardDisplayed)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('does not render if reminder is already displayed', () => {
    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreReminderDisplayed)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('does not render if expired', () => {
    jest.useFakeTimers().setSystemTime(new Date('3001-01-01T00:00:00.000Z').getTime())

    const { queryByText } = render(
      <Provider store={createMockStore(mockStoreRewardReady)}>
        <NftReward />
      </Provider>
    )

    expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
    expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
  })

  it('hanldes the cta correctly', () => {
    jest.useFakeTimers().setSystemTime(new Date('3000-11-01T00:00:00.000Z').getTime())

    const store = createMockStore(mockStoreRewardReady)
    store.dispatch = jest.fn()

    const { getByText } = render(
      <Provider store={store}>
        <NftReward />
      </Provider>
    )

    fireEvent.press(getByText('nftCelebration.rewardBottomSheet.cta'))

    expect(store.dispatch).toHaveBeenCalledWith(
      openDeepLink(mockStoreRewardReady.home.nftCelebration.deepLink, true)
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.nft_reward_accept, {
      networkId: mockNftAllFields.networkId,
      contractAddress: mockNftAllFields.contractAddress,
      remainingDays: 30,
    })
  })

  describe('expiration pill', () => {
    it('renders correct expiration pill when reward is not about to expire', () => {
      jest.useFakeTimers().setSystemTime(new Date('2900-12-01T00:00:00.000Z').getTime())

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
      jest.useFakeTimers().setSystemTime(new Date('3000-11-01T00:00:00.000Z').getTime())

      const { getByTestId } = render(
        <Provider store={createMockStore(mockStoreRewardReady)}>
          <NftReward />
        </Provider>
      )

      const pillLabel = getByTestId('NftReward/PillLabel')
      expect(pillLabel).toHaveTextContent(
        'nftCelebration.rewardBottomSheet.expirationLabel, {"expirationLabelText":"in about 1 month"}'
      )
      expect(StyleSheet.flatten(pillLabel.props.style)).toHaveProperty('color', Colors.warningDark)
      expect(StyleSheet.flatten(getByTestId('NftReward/Pill').props.style)).toHaveProperty(
        'backgroundColor',
        Colors.warningLight
      )
    })

    it('renders correct expiration pill when reward is expired', () => {
      jest.useFakeTimers().setSystemTime(new Date('3000-11-30T23:59:59.000Z').getTime())

      const { getByTestId } = render(
        <Provider store={createMockStore(mockStoreRewardReady)}>
          <NftReward />
        </Provider>
      )

      jest.advanceTimersByTime(2000)

      const pillLabel = getByTestId('NftReward/PillLabel')
      expect(pillLabel).toHaveTextContent('nftCelebration.rewardBottomSheet.expired')
      expect(StyleSheet.flatten(pillLabel.props.style)).toHaveProperty('color', Colors.errorDark)
      expect(StyleSheet.flatten(getByTestId('NftReward/Pill').props.style)).toHaveProperty(
        'backgroundColor',
        Colors.errorLight
      )
    })
  })
})

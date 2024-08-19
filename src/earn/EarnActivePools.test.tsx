import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnActivePools from 'src/earn/EarnActivePools'
import { EarnTabType } from 'src/earn/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

const store = createMockStore({
  positions: {
    positions: [
      {
        type: 'app-token',
        networkId: NetworkId['arbitrum-sepolia'],
        address: '0x460b97bd498e1157530aeb3086301d5225b91216',
        tokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        positionId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        appId: 'aave',
        appName: 'Aave',
        symbol: 'aArbSepUSDC',
        decimals: 6,
        displayProps: {
          title: 'USDC',
          description: 'Supplied (APY: 1.92%)',
          imageUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/aave.png',
        },
        dataProps: {
          yieldRates: [
            {
              percentage: 1.9194202601763743,
              label: 'Earnings APY',
              tokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
            },
          ],
          earningItems: [],
          depositTokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
          withdrawTokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
        },
        tokens: [
          {
            tokenId: 'arbitrum-sepolia:0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d',
            networkId: NetworkId['arbitrum-sepolia'],
            address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
            symbol: 'USDC',
            decimals: 6,
            priceUsd: '0',
            type: 'base-token',
            balance: '0',
          },
        ],
        pricePerShare: ['1'],
        priceUsd: '0.999',
        balance: '10',
        supply: '190288.768509',
        availableShortcutIds: ['deposit', 'withdraw'],
      },
    ],
    earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
  },
})

describe('EarnActivePools', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )
  })
  it('renders pools count and total supplied', () => {
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <EarnActivePools />
      </Provider>
    )

    expect(getByTestId('EarnActivePools')).toBeTruthy()
    expect(getByTestId('EarnActivePools/PoolsSupplied')).toContainElement(getByText('1'))
    expect(getByTestId('EarnActivePools/TotalSupplied')).toContainElement(getByText('₱13.29'))
  })

  it('navigates to correct tab on touchable press', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnActivePools />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnActivePools'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_active_pools_cta_press)
    expect(navigate).toHaveBeenCalledWith(Screens.EarnHome, { activeEarnTab: EarnTabType.MyPools })
  })
})

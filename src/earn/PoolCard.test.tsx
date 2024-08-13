import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import PoolCard from 'src/earn/PoolCard'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'

const AAVE_EARN_POSITION: EarnPosition = {
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
        percentage: 3.3,
        label: 'Earnings APY',
        tokenId: mockArbUsdcTokenId,
      },
    ],
    earningItems: [],
    tvl: 1360000,
    depositTokenId: mockArbUsdcTokenId,
    withdrawTokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
  },
  tokens: [
    {
      tokenId: mockArbUsdcTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      address: mockUSDCAddress,
      symbol: 'USDC',
      decimals: 6,
      priceUsd: '1.2',
      type: 'base-token',
      balance: '0',
    },
    {
      tokenId: mockArbEthTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      address: 'native',
      symbol: 'ETH',
      decimals: 6,
      priceUsd: '2000',
      type: 'base-token',
      balance: '0',
    },
  ],
  pricePerShare: ['1'],
  priceUsd: '1.2',
  balance: '0',
  supply: '190288.768509',
  availableShortcutIds: ['deposit', 'withdraw'],
}

describe('PoolCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard pool={AAVE_EARN_POSITION} />
      </Provider>
    )

    expect(getByText('USDC / ETH')).toBeTruthy()
    expect(
      getByText('earnFlow.poolCard.onNetwork, {"networkName":"Arbitrum Sepolia"}')
    ).toBeTruthy()
    expect(getByText('earnFlow.poolCard.apy, {"apy":"3.30"}')).toBeTruthy()
    expect(getByText('0.00%')).toBeTruthy()
    expect(getByText('$1,360,000')).toBeTruthy()
  })

  it('navigates to enter amount when no pool balance', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard pool={AAVE_EARN_POSITION} />
      </Provider>
    )

    expect(getByText('earnFlow.poolCard.addToPool')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolCard.addToPool'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, { tokenId: mockArbUsdcTokenId })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_card_cta_press, {
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: NetworkId['arbitrum-sepolia'],
      depositTokenId: mockArbUsdcTokenId,
      tokenAmount: '0',
      providerId: 'aave',
      action: 'deposit',
    })
  })
  it('navigates to enter amount when have pool balance', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard pool={{ ...AAVE_EARN_POSITION, balance: '10' }} />
      </Provider>
    )

    expect(getByText('earnFlow.poolCard.addToPool')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolCard.addToPool'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, { tokenId: mockArbUsdcTokenId })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_card_cta_press, {
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: NetworkId['arbitrum-sepolia'],
      depositTokenId: mockArbUsdcTokenId,
      tokenAmount: '10',
      providerId: 'aave',
      action: 'deposit',
    })
  })
  it('navigates to collect screen', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard pool={{ ...AAVE_EARN_POSITION, balance: '10' }} />
      </Provider>
    )

    expect(getByText('earnFlow.poolCard.exitPool')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolCard.exitPool'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnCollectScreen, {
      depositTokenId: mockArbUsdcTokenId,
      poolTokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_card_cta_press, {
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      networkId: NetworkId['arbitrum-sepolia'],
      depositTokenId: mockArbUsdcTokenId,
      tokenAmount: '10',
      providerId: 'aave',
      action: 'withdraw',
    })
  })
})

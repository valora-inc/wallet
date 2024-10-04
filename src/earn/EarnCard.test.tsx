import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnCardDiscover } from 'src/earn/EarnCard'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

const mockPoolTokenId = `${NetworkId['arbitrum-sepolia']}:0x460b97bd498e1157530aeb3086301d5225b91216`

function createStore(balance: string = '0') {
  return createMockStore({
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
          balance: balance,
          supply: '190288.768509',
          availableShortcutIds: ['deposit', 'withdraw'],
        },
      ],
      earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
    },
  })
}

describe('EarnCardDiscover', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('renders EarnEntrypoint when multiple pools is enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )

    const { getByTestId, queryByTestId } = render(
      <Provider store={createStore()}>
        <EarnCardDiscover />
      </Provider>
    )

    expect(getByTestId('EarnEntrypoint')).toBeTruthy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_POSITIONS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders EarnActivePools when multiple pools is enabled and there are active pools', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )

    const { getByTestId, queryByTestId } = render(
      <Provider store={createStore('10')}>
        <EarnCardDiscover />
      </Provider>
    )

    expect(getByTestId('EarnActivePools')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_POSITIONS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders EarnCta when multiple pools is disabled and show stable coin earn is enabled', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: { [mockPoolTokenId]: mockTokenBalances[mockArbUsdcTokenId] },
          },
        })}
      >
        <EarnCardDiscover />
      </Provider>
    )

    expect(getByTestId('EarnCta')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_POSITIONS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders EarnActivePool when multiple pools is disabled and show stable coin earn is enabled and pool token has balance', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [mockPoolTokenId]: {
                ...mockTokenBalances[mockArbUsdcTokenId],
                tokenId: mockPoolTokenId,
                balance: '10',
              },
            },
          },
        })}
      >
        <EarnCardDiscover />
      </Provider>
    )

    expect(getByTestId('EarnActivePool')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_POSITIONS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders nothing if multiple pools and show stable coin earn are disabled', () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <EarnCardDiscover />
      </Provider>
    )

    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_POSITIONS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })
})

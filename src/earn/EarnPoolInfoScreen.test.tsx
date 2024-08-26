import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnPoolInfoScreen from 'src/earn/EarnPoolInfoScreen'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { NetworkId } from 'src/transactions/types'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const defaultStore = createMockStore({})

const mockPool = {
  address: '0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
  appId: 'allbridge',
  appName: 'Allbridge',
  availableShortcutIds: ['deposit', 'withdraw'],
  balance: '14.998',
  dataProps: {
    contractCreatedAt: '2024-05-08T09:09:55.000Z',
    depositTokenId: 'celo-mainnet:0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
    earningItems: [
      {
        amount: '0.000389',
        label: 'Earnings',
        tokenId: 'celo-mainnet:0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
      },
    ],
    manageUrl: 'https://core.allbridge.io/pools?chain=CEL',
    tvl: '328925.862',
    withdrawTokenId: 'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
    yieldRates: [
      {
        label: 'Earnings APR',
        percentage: 0.2680991659440873,
        tokenId: 'celo-mainnet:0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
      },
    ],
  },
  decimals: 3,
  displayProps: {
    description: 'Supplied (APR: 0.27%)',
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/allbridgecore.png',
    title: 'USDT',
  },
  label: 'USDT',
  networkId: 'celo-mainnet',
  positionId: 'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
  pricePerShare: ['1'],
  priceUsd: '1',
  supply: '328925.862',
  symbol: 'LP-USDT',
  tokenId: 'celo-mainnet:0xfb2c7c10e731ebe96dabdf4a96d656bfe8e2b5af',
  tokens: [
    {
      address: '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
      balance: '14.998',
      decimals: 6,
      networkId: NetworkId['celo-alfajores'],
      priceUsd: '1',
      symbol: 'USDT',
      tokenId: 'celo-mainnet:0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e',
      type: 'base-token',
    },
  ],
  type: 'app-token',
} as EarnPosition

describe('EarnPoolInfoScreen', () => {
  it('renders correctly', () => {
    const { getByTestId, getByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, { pool: mockPool })}
              />
            )
          }}
        />
      </Provider>
    )

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.chainName')
    ).toBeTruthy()

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.protocolName')
    ).toBeTruthy()

    expect(
      within(getByTestId('YieldCard')).queryAllByText(
        'earnFlow.poolInfoScreen.ratePercent, {"rate":"0.27"}'
      )
    ).toBeTruthy()

    expect(
      within(getByTestId('TvlCard')).queryAllByText('earnFlow.poolInfoScreen.tvl')
    ).toBeTruthy()
    expect(within(getByTestId('TvlCard')).queryAllByText('$328,925.86')).toBeTruthy()

    expect(within(getByTestId('AgeCard')).queryAllByText('3 months')).toBeTruthy()

    expect(getByText('earnFlow.poolInfoScreen.withdraw')).toBeTruthy()
    expect(getByText('earnFlow.poolInfoScreen.deposit')).toBeTruthy()
  })

  it('calls navigateToURI when Learn More Touchable is tapped', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, { pool: mockPool })}
              />
            )
          }}
        />
      </Provider>
    )
    fireEvent.press(
      getByText('earnFlow.poolInfoScreen.learnMoreOnProvider, {"providerName":"Allbridge"}')
    )
    expect(navigateToURI).toHaveBeenCalledWith('https://core.allbridge.io/pools?chain=CEL')
  })
})

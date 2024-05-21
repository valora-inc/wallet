import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnActivePool from 'src/earn/EarnActivePool'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockAaveArbUsdcAddress } from 'test/values'

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [networkConfig.aaveArbUsdcTokenId]: {
        networkId: NetworkId['arbitrum-sepolia'],
        address: mockAaveArbUsdcAddress,
        tokenId: networkConfig.aaveArbUsdcTokenId,
        symbol: 'aArbSepUSDC',
        priceUsd: '1',
        balance: '10.75',
        priceFetchedAt: Date.now(),
      },
    },
  },
})

describe('EarnActivePool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly with ExitAndDeposit cta', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePool
          cta="ExitAndDeposit"
          depositTokenId={networkConfig.arbUsdcTokenId}
          poolTokenId={networkConfig.aaveArbUsdcTokenId}
        />
      </Provider>
    )

    expect(getByText('earnFlow.activePools.exitPool')).toBeTruthy()
    expect(getByText('earnFlow.activePools.depositMore')).toBeTruthy()
  })

  it('should render correctly with ViewPools cta', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePool
          cta="ViewPools"
          depositTokenId={networkConfig.arbUsdcTokenId}
          poolTokenId={networkConfig.aaveArbUsdcTokenId}
        />
      </Provider>
    )

    expect(getByText('earnFlow.activePools.viewPools')).toBeTruthy()
  })

  it('should have correct analytics and navigation with ViewPools cta', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePool
          cta="ViewPools"
          depositTokenId={networkConfig.arbUsdcTokenId}
          poolTokenId={networkConfig.aaveArbUsdcTokenId}
        />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.activePools.viewPools'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_view_pools_press, {
      poolTokenId: networkConfig.aaveArbUsdcTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: 'aave-v3',
    })
    expect(navigate).toBeCalledWith(Screens.TabDiscover)
  })

  it('should have correct analytics and navigation with exit pool cta', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePool
          cta="ExitAndDeposit"
          depositTokenId={networkConfig.arbUsdcTokenId}
          poolTokenId={networkConfig.aaveArbUsdcTokenId}
        />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.activePools.exitPool'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_exit_pool_press, {
      depositTokenId: networkConfig.arbUsdcTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      tokenAmount: '10.75',
      providerId: 'aave-v3',
    })
    expect(navigate).toBeCalledWith(Screens.EarnCollectScreen, {
      depositTokenId: networkConfig.arbUsdcTokenId,
      poolTokenId: networkConfig.aaveArbUsdcTokenId,
    })
  })

  it('should have correct analytics and navigation with deposit more cta tap', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EarnActivePool
          cta="ExitAndDeposit"
          depositTokenId={networkConfig.arbUsdcTokenId}
          poolTokenId={networkConfig.aaveArbUsdcTokenId}
        />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.activePools.depositMore'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_more_press, {
      depositTokenId: networkConfig.arbUsdcTokenId,
      providerId: 'aave-v3',
      networkId: NetworkId['arbitrum-sepolia'],
    })
    expect(navigate).toBeCalledWith(Screens.EarnEnterAmount, {
      tokenId: networkConfig.arbUsdcTokenId,
    })
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AppTokenPosition } from 'src/positions/types'
import { PositionItem } from 'src/tokens/PositionItem'
import { createMockStore } from 'test/utils'
import { mockEarnPositions, mockPositions } from 'test/values'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PositionItem', () => {
  it('tracks data about the asset when tapped', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} />
      </Provider>
    )

    fireEvent.press(getByText('MOO / CELO'))

    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(AssetsEvents.tap_asset, {
      address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
      appId: 'ubeswap',
      assetType: 'position',
      balanceUsd: 2.509873993477929,
      description: 'Pool',
      network: 'celo-mainnet',
      title: 'MOO / CELO',
    })
  })

  it('navigates to internal browser manageUrl when tapped and manageUrl exists, not an earnPosition', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} />
      </Provider>
    )

    fireEvent.press(getByText('MOO / CELO'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: 'mock-position.com' })
  })
  it('does not call navigate when tapped and manageUrl does not, not an earnPosition', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[1]} />
      </Provider>
    )

    fireEvent.press(getByText('G$ / cUSD'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates to EarnPoolInfoScreen when tapped if position is an earnPosition', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          positions: {
            earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
          },
        })}
      >
        <PositionItem position={mockEarnPositions[0]} />
      </Provider>
    )

    fireEvent.press(getByText('USDC'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnPoolInfoScreen, {
      pool: mockEarnPositions[0],
    })
  })

  it('shows the correct info for a position', () => {
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('₱3.34')).toBeTruthy()
    expect(getByText('11.90')).toBeTruthy()
  })

  it('shows the correct info for a position with balance hidden', () => {
    const { getByText, queryByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={mockPositions[0]} hideBalances={true} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(queryByText('₱3.34')).toBeFalsy()
    expect(queryByText('11.90')).toBeFalsy()
  })

  it('shows the correct info for a position with a negative balance', () => {
    const mockPosition = mockPositions[0] as AppTokenPosition
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={{ ...mockPosition, balance: `-${mockPosition.balance}` }} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('-₱3.34')).toBeTruthy()
    expect(getByText('-11.90')).toBeTruthy()
  })

  it('shows the correct info for a position with a 0 price', () => {
    const mockPosition = mockPositions[0] as AppTokenPosition
    const { getByText } = render(
      <Provider store={createMockStore({})}>
        <PositionItem position={{ ...mockPosition, priceUsd: '0' }} />
      </Provider>
    )

    expect(getByText('MOO / CELO')).toBeTruthy()
    expect(getByText('Pool')).toBeTruthy()
    expect(getByText('-')).toBeTruthy()
    expect(getByText('11.90')).toBeTruthy()
  })
})

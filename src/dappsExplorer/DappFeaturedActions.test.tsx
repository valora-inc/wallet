import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockDappList, mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/analytics/AppAnalytics')

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(() => true),
}))

describe('DappFeaturedActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all featured actions correctly', () => {
    const { getByText, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappList,
            mostPopularDappIds: ['dapp2'],
          },
          positions: {
            positions: mockPositions,
            shortcuts: mockShortcuts,
          },
        })}
      >
        <DappFeaturedActions />
      </Provider>
    )

    expect(getByText('dappShortcuts.rewards.title')).toBeTruthy()
    expect(getByText('dappShortcuts.rewards.description')).toBeTruthy()
    expect(getAllByTestId('DappFeaturedAction')).toHaveLength(1)

    fireEvent.press(getAllByTestId('DappFeaturedAction')[0])
    expect(navigate).toHaveBeenCalledWith(Screens.DappShortcutsRewards)
  })

  // TODO add test for impression analytics on scroll

  it('should not render dapp rewards shortcut if there are no claimable rewards', () => {
    const { toJSON } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappList,
            mostPopularDappIds: ['dapp2'],
          },
          positions: {
            positions: mockPositions.map((position) => ({
              ...position,
              availableShortcutIds: [],
            })),
            shortcuts: mockShortcuts,
          },
        })}
      >
        <DappFeaturedActions />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })
})

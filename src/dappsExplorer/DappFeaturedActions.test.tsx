import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import { createMockStore } from 'test/utils'
import { mockDappList } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappRankingsEnabled: true,
  })),
  getFeatureGate: jest.fn(() => true),
}))

describe('DappFeaturedActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all featured actions correctly', () => {
    const onPressRankingsSpy = jest.fn()
    const { getByText, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappList,
            mostPopularDappIds: ['dapp2'],
          },
        })}
      >
        <DappFeaturedActions onPressShowDappRankings={onPressRankingsSpy} />
      </Provider>
    )

    expect(getByText('dappRankings.title')).toBeTruthy()
    expect(getByText('dappRankings.description')).toBeTruthy()
    expect(getByText('dappShortcuts.rewards.title')).toBeTruthy()
    expect(getByText('dappShortcuts.rewards.description')).toBeTruthy()

    fireEvent.press(getAllByTestId('DappFeaturedAction')[0])
    expect(onPressRankingsSpy).toHaveBeenCalled()

    // TODO add test for press dapp shortcuts card
  })

  // TODO add test for impression analytics on scroll

  it('should not render dapp rankings card if there are no popular dapps', () => {
    const { queryByText, getByText, getAllByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappList,
            mostPopularDappIds: [],
          },
        })}
      >
        <DappFeaturedActions onPressShowDappRankings={jest.fn()} />
      </Provider>
    )

    expect(getAllByTestId('DappFeaturedAction')).toHaveLength(1)
    expect(queryByText('dappRankings.title')).toBeFalsy()
    expect(getByText('dappShortcuts.rewards.title')).toBeTruthy()
  })
})

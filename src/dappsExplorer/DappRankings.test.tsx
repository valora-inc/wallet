import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DappRankings from 'src/dappsExplorer/DappRankings'
import { createMockStore } from 'test/utils'
import { mockDappListV2 } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappRankingsEnabled: true,
  })),
}))

describe('DappRankings', () => {
  it('should render correctly', () => {
    const { getByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappListV2,
            mostPopularDappIds: ['dapp2'],
          },
        })}
      >
        <DappRankings />
      </Provider>
    )

    fireEvent.press(getByTestId('DappRankings'))

    expect(getByText('dappRankings.title')).toBeTruthy()
    expect(getByText('dappRankings.description')).toBeTruthy()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_rankings_open)
  })

  it('should render nothing if there are no popular dapps', () => {
    const { queryByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappListV2,
            mostPopularDappIds: [],
          },
        })}
      >
        <DappRankings />
      </Provider>
    )

    expect(queryByTestId('DappRankings')).toBeFalsy()
  })
})

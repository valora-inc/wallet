import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DappRankingsBottomSheet, DappRankingsCard } from 'src/dappsExplorer/DappRankings'
import { createMockStore } from 'test/utils'
import { mockDappListV2 } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappRankingsEnabled: true,
  })),
}))

describe('DappRankings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    const onPressSpy = jest.fn()
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
        <DappRankingsCard onPress={onPressSpy} />
      </Provider>
    )

    expect(getByText('dappRankings.title')).toBeTruthy()
    expect(getByText('dappRankings.description')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_rankings_impression)

    fireEvent.press(getByTestId('DappRankings'))

    expect(onPressSpy).toHaveBeenCalled()
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
        <DappRankingsCard onPress={jest.fn()} />
      </Provider>
    )

    expect(queryByTestId('DappRankings')).toBeFalsy()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should render the correct list of ranked dapps', () => {
    const onPressSpy = jest.fn()
    const { getByText, getAllByTestId, getByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappListV2,
            mostPopularDappIds: ['dapp2'],
          },
        })}
      >
        <DappRankingsBottomSheet onPressDapp={onPressSpy} forwardedRef={{ current: null }} />
      </Provider>
    )

    expect(getByText('dappRankings.title')).toBeTruthy()
    expect(getByText('dappRankings.description')).toBeTruthy()
    expect(getAllByTestId('PopularDappCard')).toHaveLength(1)
    expect(getByText(mockDappListV2[1].name)).toBeTruthy()

    fireEvent.press(getByTestId('Dapp/dapp2'))

    expect(onPressSpy).toHaveBeenCalledWith({
      ...mockDappListV2[1],
      openedFrom: 'mostPopular',
    })
  })
})

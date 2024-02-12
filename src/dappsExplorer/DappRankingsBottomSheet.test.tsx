import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { favoriteDapp, unfavoriteDapp } from 'src/dapps/slice'
import { DappRankingsBottomSheet } from 'src/dappsExplorer/DappRankingsBottomSheet'
import { createMockStore } from 'test/utils'
import { mockDappList } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappRankingsEnabled: true,
  })),
}))

describe('DappRankingsBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the correct list of ranked dapps', () => {
    const onPressSpy = jest.fn()
    const { getByText, getAllByTestId, getByTestId } = render(
      <Provider
        store={createMockStore({
          dapps: {
            dappListApiUrl: 'http://url.com',
            dappsList: mockDappList,
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
    expect(getByText(mockDappList[1].name)).toBeTruthy()

    fireEvent.press(getByTestId('Dapp/dapp2'))

    expect(onPressSpy).toHaveBeenCalledWith(
      {
        ...mockDappList[1],
        openedFrom: 'mostPopular',
      },
      0
    )
  })

  it('should favorite a dapp', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList: mockDappList,
        mostPopularDappIds: ['dapp2'],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <DappRankingsBottomSheet onPressDapp={jest.fn()} forwardedRef={{ current: null }} />
      </Provider>
    )

    fireEvent.press(getByTestId('Dapp/Favorite/dapp2'))

    expect(store.getActions()).toEqual([favoriteDapp({ dappId: 'dapp2' })])
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_favorite, {
      categories: ['2'],
      dappId: 'dapp2',
      dappName: 'Dapp 2',
      section: 'mostPopular',
    })
  })

  it('should unfavorite a dapp', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList: mockDappList,
        mostPopularDappIds: ['dapp2'],
        favoriteDappIds: ['dapp2'],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <DappRankingsBottomSheet onPressDapp={jest.fn()} forwardedRef={{ current: null }} />
      </Provider>
    )

    fireEvent.press(getByTestId('Dapp/Favorite/dapp2'))

    expect(store.getActions()).toEqual([unfavoriteDapp({ dappId: 'dapp2' })])
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_unfavorite, {
      categories: ['2'],
      dappId: 'dapp2',
      dappName: 'Dapp 2',
      section: 'mostPopular',
    })
  })
})

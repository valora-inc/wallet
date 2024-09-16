import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import TabActivity from 'src/home/TabActivity'
import { RootState } from 'src/redux/reducers'
import MockedNavigator from 'test/MockedNavigator'
import { RecursivePartial, createMockStore } from 'test/utils'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

describe('TabActivity', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResponse(
      JSON.stringify({
        data: {
          tokenTransactionsV2: {
            transactions: [],
          },
        },
      })
    )
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}, screenParams = {}) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={TabActivity} params={screenParams} />
      </Provider>
    )

    return {
      store,
      tree,
      ...tree,
    }
  }

  it('renders activity tab correctly and fires initial actions', async () => {
    const { store } = renderScreen()

    await waitFor(() =>
      expect(store.getActions().map((action) => action.type)).toEqual(
        expect.arrayContaining(['HOME/REFRESH_BALANCES'])
      )
    )
  })
})
